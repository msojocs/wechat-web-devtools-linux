{
    const createElement = document.createElement
    document.createElement = function (tagName) {
        const instance = createElement.call(document, tagName)
        if (tagName === 'iframe') {
            instance.setAttribute('nwdisable', 'true')
        } else if (tagName === 'webview') {
            Object.defineProperty(instance, 'instance', {
                set(value) {
                    console.warn('webview instance set', value)
                    this._instance = value
                    if (value) {
                        Object.defineProperty(value, '_type', {
                            set(type) {
                                console.warn('webview type set', type)
                                this.__type = type
                                if (type === 'skyline_appservice') {
                                    const client = require('skyline-addon/build/skyline.node')
                                    const setErrorMsg = (msg) => {
                                        console.error('skyline error', msg)
                                        const store = require('core.wxvpkg/b7691e109ad844af265d9385e5205802.js')
                                        if (msg?.includes('Not connected')) {
                                            msg = 'Skyline链接丢失，请检查服务状态'
                                        } else if (msg?.includes('Socket connection failed') || msg?.includes('Connection refused')) {
                                            msg = 'Skyline连接失败，请检查服务状态'
                                        }
                                        store.dispatch({
                                            type: 'SIMULATOR_LAUNCH_ERROR',
                                            data: msg || 'Skyline出现异常，无法启动AppService，请检查Skyline是否正常运行',
                                        })
                                    }
                                    try {
                                        client.Controller.connect()
                                    } catch (e) {
                                        console.error('connect skyline error', e)
                                        setErrorMsg(e?.message)
                                        throw e
                                    }
                                    const controller = new client.Controller(setErrorMsg)
                                    const webview = controller.webview
                                    Object.defineProperties(this, {
                                        src: {
                                            set(src) {
                                                console.warn('skyline_appservice webview set src', src)
                                                webview.src = src
                                                this.__webview__.src = 'about:blank'
                                            },
                                            get() {
                                                console.warn('skyline_appservice webview get src', webview.src)
                                                return webview.src
                                            },
                                            configurable: true,
                                        },
                                    })
                                    webview.showDevTools = async function (show, container) {
                                        try{ 
                                            // 1. 获取列表
                                            const resp = await fetch('http://127.0.0.1:9222/json/list')
                                            const list = await resp.json()
                                            // 2. 筛选 webview - appservice/mainframe
                                            const target = list.find(item => item.type === 'webview')
                                            // 3. 取到 webSocketDebuggerUrl
                                            const webSocketDebuggerUrl = target.webSocketDebuggerUrl.replace('ws://', '')
                                            // devtools://devtools/bundled/devtools_app.html?ws=127.0.0.1:9222/devtools/page/7601AF914FBACB429A289A8AC7AA82EB
                                            container.src = `devtools://devtools/bundled/devtools_app.html?ws=${webSocketDebuggerUrl}`
                                            // this.__webview__.showDevTools(show, container)
                                        }
                                        catch(e){
                                            console.error('showDevTools error', e)
                                            require('core.wxvpkg/b7691e109ad844af265d9385e5205802.js').dispatch({
                                                type: 'SIMULATOR_LAUNCH_ERROR',
                                                data: 'Skyline出现异常，无法启动AppService，请检查Skyline是否正常运行',
                                            })
                                        }
                                    }
                                    this.getOriginElement = function () {
                                        return webview
                                    }
                                    this.setAttribute = function (name, value) {
                                        return webview.setAttribute(name, value)
                                    }
                                    {
                                        const mount = this.mount
                                        this.mount = function (e) {
                                            mount.apply(this, e)
                                            controller.mount()
                                        }
                                    }
                                    {
                                        const unmount = this.unmount
                                        this.unmount = function (e) {
                                            unmount.apply(this, e)
                                            controller.unmount()
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