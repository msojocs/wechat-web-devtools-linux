## 0. 先定位 `fire` 到底在哪个进程

你贴的这段在 **main 进程**（`js/ec7863bcdd00dc41366489894e257cf3.js`，`WebviewManagerServiceMain`）：

```js
const n = this._callbackManager.wrap("" + o, (t, i) => { e.returnValue = t ? "" : i.result || "" });
s.dialog.emitter.fire({ messageType: "prompt", messageText: t[0], callbackId: n });
```

- `s.dialog.emitter` 是 main 进程里按 `webContentsId` 存的 `Emitter`（`getEmitterMapInfo(id).dialog`）。
- preload 跑在 renderer，**拿不到 main 的对象**，所以没法直接调这个 `fire`。

但 `fire` 的**效果**在 renderer 内部可以 1:1 复刻，因为整条派发链的最后一跳就在 renderer：

```
main emitter.fire(data)
 → EventFire 帧(204) → renderer ChannelClient.handlers[id](data) → em.fire(data)
 → _dialogListenerFactory 生成的监听函数
 → this.emitEvent(webview, 'dialog', {preventDefault, messageText, messageType, dialog:{ok,cancel}})
 → AppService 组件 handler（aaf1281…js:660）
 → e.dialog.ok(JSON.stringify({compileTs}))
 → mainWebviewService.callback(callbackId, undefined, {type:'ok', result})
 → main _callbackManager.callback → e.returnValue
```

**关键点：`fire` 的等价物就是 `WebviewManagerService.emitEvent(el, 'dialog', payload)`。**

---

## 1. preload 里怎么拿到入口

### 1.1 在 skyline 补丁里 —— 现成的

`res/scripts/core_index.js` 的 `_type` setter 里，`this` 就是 **WebviewInstance**：

```js
// js/748722551db9081ea2b03d703f7ac61e.js（WebviewInstanceBase 构造）
this.__webview__ = document.createElement('webview')
this.__webview__.instance = this        // ← 补丁的 set(value) 收到的 value
...
this.webviewManagerService = t          // ← renderer 侧 WebviewManagerService 实例
```

而 `on()` 也是转发到它：

```js
on(e, t, i) { this.webviewManagerService.onEvent(this, e, t, i) }   // 9ee5d191…js / base 类
```

所以 `emitEvent` 的两个入参（key 和 service）在补丁里都是现成的：

```js
const wvm = this.webviewManagerService        // WebviewManagerService
// key 就是 this 本身
```

### 1.2 不在补丁里 —— 从 preload 找

```js
const { Root } = require('../b13c2c668609cba404080237f3abc874.js')                 // 渲染进程 root
const { IWebviewManagerService } = require('../4e21599cebc2825cfb5c6be748ef7f74.js')
const wvm = Root.iis.invokeFunction(acc => acc.get(IWebviewManagerService))
```

> `ea725c2bb0a3c51b7e9b93e0e47564ab.js` 里 `registerSingleton(IWebviewManagerService, WebviewManagerService)`，所以 DI 里拿到的是 **renderer 侧那个单例**，不是 main 的代理（代理注册在 `IWebviewManagerServiceMain` 这个 token 下）。
> 注意 `Root.iis` 是 lazy 的：如果渲染进程还没建过 Root，preload 抢先访问会**新建一个容器**，那时 `emitEvent` 找不到组件注册的 handler。稳妥做法是 `Root.getService(...)`（返回 Promise）或干脆用 1.1 的 `this.webviewManagerService`。

找目标 webview 实例：
```js
wvm.getAnyMounted('appservice_' + runtimeId)          // 查 webview[partition="persist:appservice_xxx"] 的 .instance
// 或
[...wvm._webviewMap.values()].find(v => v._type === 'skyline_appservice')
wvm.getWebviewById(id)
```

---

## 2. 调用 fire 的等价写法 + 同步拿结果

```js
/**
 * 复刻 main 进程的 dialog 派发，直接拿到微信原版 handler 的返回值。
 * @param {object} webviewInstance  emitEvent 的 key（组件 on() 时的 this）
 * @param {string} messageText
 * @param {'prompt'|'alert'|'confirm'} messageType
 */
function askOriginalDialog(webviewInstance, messageText, messageType = 'prompt') {
  const wvm = webviewInstance.webviewManagerService
  const info = wvm.getEventHandlerInfo(webviewInstance, 'dialog')   // 会按需创建 {handler: []}

  if (!info.handler || info.handler.length === 0) {
    return Promise.resolve({ answered: false, reason: 'no-dialog-handler' })
  }

  return new Promise((resolve) => {
    let settled = false
    const done = (r) => { if (!settled) { settled = true; resolve(r) } }

    wvm.emitEvent(webviewInstance, 'dialog', {
      // main 的 _dialogListenerFactory 里 preventDefault 只置内部标志，这里给个空实现
      preventDefault() {},
      messageText,
      messageType,
      dialog: {
        ok: (value) => done({ answered: true, type: 'ok', result: value }),
        cancel: () => done({ answered: true, type: 'cancel', result: undefined }),
      },
    })

    // emitEvent 是同步派发；但组件 handler 是 async，若它在 await 之后才调 ok，需要兜底
    setTimeout(() => done({ answered: false, reason: 'timeout' }), 3000)
  })
}
```

用法（放在 skyline 的 prompt 回调里）：

```js
controller.setPromptCallback(async (skylineWebview, request) => {
  const resolve = (result) => controller.resolvePrompt(request.requestId, result)

  if (request.message === 'GET_RUNTIME_INSTANCE_INFO') {
    const r = await askOriginalDialog(this, 'GET_RUNTIME_INSTANCE_INFO', 'prompt')
    if (r.answered && r.type === 'ok') return resolve(r.result)      // 原版返回的 JSON 串
    // 兜底：原 handler 还没注册，走 store
    const ts = store.getState()?.simulator?.compileCommand?.ts
    return resolve(Number.isFinite(Number(ts)) && Number(ts) > 0
      ? JSON.stringify({ compileTs: Number(ts) })
      : 'Skyline runtime info is not ready')
  }
  ...
})
```

### 为什么这样就能拿到结果

- `emitEvent` 里遍历 handler 并 `e.handler(...n)`，`n[0]` 就是你造的 payload；
- AppService 组件 handler（`aaf1281…js:681-687`）同步走到 `e.dialog.ok(JSON.stringify({compileTs: this.props.compileCommand.ts}))`；
- `ok` 是你自己的闭包 → **结果直接落到 Promise**，不需要 `callbackId`。

---

## 3. 关于 `callbackId`：自己造是没用的

`callbackId` 不是标识符，是 **main 进程 `CallbackManager` 的注册键**：

```js
wrap(prefix, fn) { const n = this._id++; this._map.set(`${prefix}_${n}`, fn); return `${prefix}_${n}` }  // "3_12"
callback(id, ...args) { const r = this._map.get(id); r && (r(...args), this._map.delete(id)) }
```

- 它由 main 在 `onPrompt` 里生成并绑定了闭包 `(t, i) => { e.returnValue = t ? "" : i.result || "" }`；
- renderer 侧 `mainWebviewService.callback(id, undefined, {type:'ok', result})` 会一路 RPC 回 main 查表；
- **preload 自己编一个 id 调 `callback` 会被静默丢弃**（`this._map.get(id)` 为 undefined），既不会报错也不会回写 `event.returnValue`。

所以结论：
- **想自己触发并拿结果** → 用第 2 节的闭包方式，`callbackId` 直接省掉。
- **想复用 `_dialogListenerFactory`**（它带 3s 超时、`[webviewManager] dialog ok` 日志、以及 `callbackId` 回写）→ 做不到捕获结果，因为 `ok` 是工厂内部创建的、不对外暴露；只能自己重写那段逻辑（40 行，见 `18ad45…js:153-193`）。

---

## 4. 反向：接收 main 真实发来的 fire

如果目标是有真实 guest 的场景（main 会主动 fire），就照 `initEventListener` 的做法订阅：

```js
const wcId = await webviewInstance.getWebContentsId()          // 注意 skyline 下这是原生 webview 的 id
const mainWebviewService = /* DI 里的 IWebviewManagerServiceMain 代理 */
const dispose = mainWebviewService.onDynamicEvent(wcId, 'dialog')((payload) => {
  // payload = { messageType: 'prompt', messageText: '...', callbackId: '3_12' }
  // 要应答就：
  mainWebviewService.callback(payload.callbackId, undefined, { type: 'ok', result: JSON.stringify({ compileTs: ts }) })
  // 或 { type: 'cancel' } → main 侧 e.returnValue = ""
})
// dispose() 撤销订阅（会发 EventDispose 帧）
```

`onDynamicEvent` 返回的就是那个 Event 函数（第 3 轮讲的 ProxyChannel 特判），调用它即完成 `EventListen` 握手。

---

## 5. 三个坑

1. **handler 注册是异步的**：`onEvent` → `initEventListener('dialog')` 里 `await e.getWebContentsId()` → 等 `_ready`（domReady）。skyline 下 `getOriginElement()` 被换成原生 webview，domReady 能不能来取决于原生侧有没有派发 `dom-ready`。所以第 2 节一定要先判 `handler.length`，并留 store 兜底。
2. **`emitEvent` 吞异常**：handler 抛错会被 `catch (e) {}` 静默吞掉，只返回第一个 handler 的返回值；排查时用 `try/catch` 包不了，得看 handler 内部。
3. **`$$` 包装**：payload 的 `messageText` 若以 `$$` 开头，AppService handler 会先 `JSON.parse` 再比对 `common.compileTs` 与当前 `compileCommand.ts`，不一致就 `ok("")`（丢旧世代）。想模拟 instance frame 的世代校验就传 `$${"msg":"GET_RUNTIME_INSTANCE_INFO","common":{"compileTs":X}}`，想拿当前值就传裸串。