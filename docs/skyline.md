# Skyline 实现方案与进度

## 现状

本项目是一个windows软件的移植项目，大部分功能都完成了移植，但是存在部分功能无法移植。

无法移植的原因：功能相关的模块使用native语言编写，且找不到linux版本，无法移植。

如何实现：希望通过通信能形式间接实现功能。

## 模块原理

Skyline是一个基于flutter engine的定制化渲染引擎，是一个node native模块，模仿实现几乎不可能。

1. 小程序逻辑层，是用来调用skyline.node渲染画面的。
2. 渲染后把像素写入共享内存。
3. UI显示层，读取共享内存的项目进行渲染。
4. 还有一个连接小程序逻辑层的devtools。
5. 用户操作UI显示层会把动作发送给小程序逻辑层（应该是websocket），逻辑层处理后更新共享内存的画面数据。

## 实现方案

于是采用折中的方案：

1. 将小程序逻辑层放到wine+electron+skyline.node+sharedMemory.node中执行；sharedMemory.node是win定制版，支持linux与wine数据互通；skyline.node是原版。
2. UI显示层调用的sharedMemory.node使用Linux版本。
3. 拦截wechat-devtools的一些操作，通过skyline-client-server项目进行通信，控制wine逻辑层。

sharedMemory 线上版本：https://github.com/msojocs/skyline-shared-memory，本地目录 `~/github/skyline-shared-memory`。

Wine 逻辑层项目：`~/github/skyline-client-server`。

## DevTools显示

### 分离逻辑
核心逻辑
```js
const { app, BrowserWindow } = require('electron')

let win = null
let devtools = null

app.whenReady().then(() => {
  // 小程序逻辑层webview
  win = new BrowserWindow()
  // 调试器webview
  devtools = new BrowserWindow()
  win.loadURL('https://github.com')
  win.webContents.setDevToolsWebContents(devtools.webContents)
  win.webContents.openDevTools({ mode: 'detach' })
})
```

实际操作：
```js
async showDevTools(e, t) {
  console.warn("[analytics] showDevTools called", e, t);
  // 根据webviewId找到实例
  const logicLayer = this.getWebContentById(e),
    devtoolsPanel = this.getWebContentById(t),
    o = (0, n.getDefaultInspectorDirInfo)();
  return (
    (this.inspectorDir = o.dir),
    console.info("[WebviewManagerServiceMain.showDevTools]", {
      inspectorDir: this.inspectorDir,
      inspectorSource: o.source,
      inspectorReason: o.reason,
      inspectorVersion: o.version,
      inspectorVendorVersion: o.vendorVersion,
      inspectorBundledVersion: o.bundledVersion,
    }),
    // 加载扩展插件
    await logicLayer.session.extensions.loadExtension(s.WeappPlugin).catch((e) => {
      this.logService.warn(
        "[WebviewManagerServiceMain.showDevTools] loadExtension",
        e,
      );
    }),
    this.interceptDevtools(t),
    // 设置逻辑层的调试器上下文
    logicLayer.setDevToolsWebContents(devtoolsPanel),
    // 打开逻辑层的调试器
    logicLayer.openDevTools(),
    this._browserToDevtools.set(e, t),
    devtoolsPanel.once("destroyed", () => {
      this._browserToDevtools.get(e) === t &&
        this._browserToDevtools.delete(e);
    }),
    logicLayer.once("destroyed", () => {
      this._browserToDevtools.delete(e);
    }),
    // 重载调试器
    await devtoolsPanel.executeJavaScript("window.location.reload()")
  );
}
```

内部获取实例通过`require("electron/main").webContents.fromId(id)`进行

## 2026-09-09 现状审计

完整链路应为：

```text
Linux wechat-devtools renderer
  -> Linux skyline.node 客户端
  -> Wine 中的 Windows Electron server
  -> 官方 Windows skyline.node（SkylineShell 引擎）
  -> Windows sharedMemory.node
  -> /dev/shm
  -> Linux sharedMemory.node
  -> Linux pageframe 显示
```
