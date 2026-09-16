{
    const createElement = document.createElement
    document.createElement = function (tagName) {
        const instance = createElement.call(document, tagName)
        if (tagName === 'webview') {
            Object.defineProperty(instance, 'instance', {
                set(value) {
                    console.warn('webview instance set', value)
                    this._instance = value
                    if (value) {
                        Object.defineProperty(value, '_type', {
                            set(type) {
                              const store = require('../b7691e109ad844af265d9385e5205802.js').default
                                console.warn('webview type set', type)
                                this.__type = type
                                if (type === 'skyline_appservice') {
                                    if (this._controller) return;
                                    const client = require('skyline-addon/build/render-client.node')
                                    const isDisconnectedError = (error) => /not connected|peer disconnected|closed connection|connection (?:refused|reset|aborted)|broken pipe|socket connection failed/i.test(error?.message || String(error))
                                    let disconnected = false
                                    let errorScheduled = false
                                    let lastError
                                    const setErrorMsg = (msg) => {
                                        if (isDisconnectedError(msg)) {
                                            if (disconnected) return
                                            disconnected = true
                                            msg = 'Skyline连接已断开，请重新启动服务后重新打开项目'
                                        }
                                        console.error('skyline error', msg)
                                        lastError = msg || 'Skyline出现异常，无法启动AppService，请检查Skyline是否正常运行'
                                        if (errorScheduled) return
                                        errorScheduled = true
                                        // Native RPC calls notify and then throw. Do not update React
                                        // synchronously inside that callback or a commit/unmount hook.
                                        queueMicrotask(() => {
                                            errorScheduled = false
                                            store.dispatch({
                                                type: 'SIMULATOR_LAUNCH_ERROR',
                                                data: lastError,
                                            })
                                        })
                                    }
                                    // Only lifecycle effects can finish locally after the peer exits.
                                    // Keep failures unrelated to a lost connection observable.
                                    const runLifecycle = (operation) => {
                                        if (disconnected) return
                                        try {
                                            return operation()
                                        } catch (error) {
                                            if (!isDisconnectedError(error)) throw error
                                            setErrorMsg(error.message)
                                        }
                                    }
                                    try {
                                        client.Controller.connect()
                                    } catch (e) {
                                        console.error('connect skyline error', e)
                                        setErrorMsg(e?.message)
                                        throw e
                                    }
                                    const controller = new client.Controller(setErrorMsg)
                                    this._controller = controller
                                    window.__test = this

                                    // The native Controller is created here for the real
                                    // skyline_appservice webview. Register the dialog route
                                    // before src/mount can cause the guest to call sendSync.
                                    controller.setDialogCallback((skylineWebview, requestId, type, ...args) => {
                                        console.warn('[skyline] dialog callback', {
                                            requestId,
                                            type,
                                            args,
                                        })
                                        const resolve = (result) => {
                                            console.warn('[skyline] resolve dialog', {
                                                requestId,
                                                result,
                                            })
                                            runLifecycle(() => controller.resolveDialog(requestId, result))
                                        }

                                        this.webviewManagerService.emitEvent(this, 'dialog', {
                                            preventDefault() {},
                                            messageText: args[0],
                                            messageType: type,
                                            dialog: {
                                                ok(result) {
                                                    console.warn('[skyline] dialog ok', {
                                                        requestId,
                                                        result,
                                                    })
                                                    resolve(result)
                                                },
                                                cancel() {
                                                    console.warn('[skyline] dialog cancel', {
                                                        requestId,
                                                    })
                                                    resolve()
                                                },
                                            },
                                        })
                                    })
                                    {
                                      const showDevTools = this.webviewManagerService.mainWebviewService.showDevTools
                                      this.webviewManagerService.mainWebviewService.showDevTools = function(e, t) {
                                        console.warn('[analytics] intercepted showDevTools', { e, t })
                                        if (e === 114514) {
                                          return Promise.resolve()
                                        }
                                        return showDevTools.call(this.webviewManagerService.mainWebviewService, e, t)
                                      }
                                    }
                                    const webview = controller.webview
                                    // Event cleanup uses getOriginElement() directly, bypassing the
                                    // instance's setAttribute/unmount adapters.
                                    for (const method of ['setAttribute', 'removeAttribute', 'addEventListener', 'removeEventListener', 'send']) {
                                        const original = webview[method]
                                        webview[method] = (...args) => runLifecycle(() => original.apply(webview, args))
                                    }
                                    let src = ''
                                    Object.defineProperties(this, {
                                        src: {
                                            set(value) {
                                                src = value
                                                runLifecycle(() => { webview.src = value })
                                                this.__webview__.src = 'about:blank'
                                            },
                                            get() {
                                                return src
                                            },
                                            configurable: true,
                                        },
                                    })
                                    {
                                      const getId = webview.getWebContentsId
                                      let id
                                      webview.getWebContentsId = () => {
                                          if (id === undefined) id = 114514 + getId()
                                          return id
                                      }
                                    }
                                    this.getOriginElement = function () {
                                        return webview
                                    }
                                    this.setAttribute = function (name, value) {
                                        if (name === 'webpreferences') {
                                            value += ',enableBlinkFeatures=SharedArrayBuffer'
                                        } else if (name === 'preload') {
                                          //  file:/// 前缀替换成 file:///Z:/
                                          if (value.startsWith('file:///')) {
                                              value = value.replace('file:///', 'file:///Z:/')
                                          }
                                        }
                                        return webview.setAttribute(name, value)
                                    }
                                    {
                                        const mount = this.mount
                                        this.mount = function () {
                                            return runLifecycle(() => {
                                                // The local webview is a placeholder. The real
                                                // appservice must only be mounted in Wine.
                                                mount.call(this)
                                                controller.mount()
                                            })
                                        }
                                    }
                                    {
                                        const unmount = this.unmount
                                        let unmountPromise
                                        this.unmount = function (...args) {
                                            // Finish local manager/listener cleanup even when Wine is
                                            // gone. Preserve the base method's Promise and arguments.
                                            if (!unmountPromise) {
                                                unmountPromise = (async () => {
                                                    try {
                                                        await unmount.apply(this, args)
                                                    } finally {
                                                        runLifecycle(() => controller.unmount())
                                                    }
                                                })()
                                            }
                                            return unmountPromise
                                        }
                                    }
                                }
                            },
                            get() {
                                return this.__type
                            },
                            configurable: true,
                        })
                    }
                },
                get() {
                    return this._instance
                },
                configurable: true,
            })
        }
        return instance
    }
}
