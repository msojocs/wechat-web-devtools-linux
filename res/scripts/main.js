{
  (async () => {
    try {
      const { webContents } = require('electron')
      const { mainController } = require('skyline-addon/build/main-client.node')
      mainController.connect('127.0.0.1', 3002)
      console.info('webContents', mainController.electron.webContents)
      {
        const fromId = webContents.fromId
        webContents.fromId = function(id) {
          console.log('[webContents.fromId] called with id:', id)
          if (id >= 114514) {
            const webContents = mainController.electron.webContents.fromId(id - 114514)
            {
              let devToolsWebContents = null
              webContents.setDevToolsWebContents = function(webContents) {
                console.log('[analysis][webContents.setDevToolsWebContents] ignored')
                devToolsWebContents = webContents
              }
              webContents.openDevTools = async function () {
                  try{
                      // 1. 获取列表
                      const resp = await fetch('http://127.0.0.1:9222/json/list')
                      const list = await resp.json()
                      // 2. 筛选 webview - appservice/mainframe
                      const target = list.find(item => item.type === 'webview')
                      // 3. 取到 webSocketDebuggerUrl
                      const webSocketDebuggerUrl = target.webSocketDebuggerUrl.replace('ws://', '')
                      // devtools://devtools/bundled/devtools_app.html?ws=127.0.0.1:9222/devtools/page/7601AF914FBACB429A289A8AC7AA82EB
                      devToolsWebContents.loadURL(`devtools://devtools/bundled/devtools_app.html?ws=${webSocketDebuggerUrl}`)
                      // this.__webview__.showDevTools(show, container)
                  }
                  catch(e){
                      console.error('showDevTools error', e)
                      store.dispatch({
                          type: 'SIMULATOR_LAUNCH_ERROR',
                          data: 'Skyline出现异常，无法启动AppService，请检查Skyline是否正常运行',
                      })
                  }
              }
            }
            return webContents
          }
          return fromId.call(this, id)
        }
      }
      
    } catch(err) {
      console.error('[async IIFE] Error:', err)
    }
  })()
}