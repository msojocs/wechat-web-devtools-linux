# WebSocket修复

自 nw0.76.0 开始，调试器的WebSocket无法建立链接。

## 原因

旧版本似乎不会对websocket请求进行拦截，而在某一版本开始chrome支持websocket请求拦截；



## 解决

文件路径：`cache/core.wxvpkg.ext/f67cdfd87843382519d9c48d8a0bd4dc.js`

添加以下内容：

```javascript
  (this._onBeforeRequest = (e) => {
    console.warn('----webview request for:', e)
    if (/^wss?:\/\//i.test(e.url)) return void 0; // add
    if ("function" == typeof this.onBeforeRequest)
      return this.onBeforeRequest(e);
  }),
```