(() => {
    const nwVersion = globalThis?.process?.versions.nw.split('.').map(Number)
    if (nwVersion && nwVersion[1] >= 101){
        // 处理此报错 -> Uncaught TypeError: 'getOwnPropertyDescriptor' on proxy: trap reported non-configurability for property 'arguments' which is either non-existent or configurable in the proxy target
        // Wrap global Proxy to sanitize handlers and avoid proxy invariant errors
        const _OrigProxy = Proxy;
        function makeSafeHandler(target, handler) {
            handler = handler || {};
            const safe = Object.create(handler);

            if (typeof handler.ownKeys === 'function') {
                const origOwnKeys = handler.ownKeys.bind(handler);
                safe.ownKeys = function(t) {
                    try {
                        const keys = origOwnKeys(t);
                        return keys.filter(k => typeof k === 'string' && k !== 'arguments' && k !== 'caller');
                    } catch (e) {
                        try { return Reflect.ownKeys(t).filter(k => typeof k === 'string' && k !== 'arguments' && k !== 'caller'); } catch (_) { return []; }
                    }
                };
            } else {
                safe.ownKeys = function(t) {
                    try { return Reflect.ownKeys(t).filter(k => typeof k === 'string' && k !== 'arguments' && k !== 'caller'); } catch (_) { return []; }
                };
            }

            if (typeof handler.getOwnPropertyDescriptor === 'function') {
                const origGOPD = handler.getOwnPropertyDescriptor.bind(handler);
                safe.getOwnPropertyDescriptor = function(t, prop) {
                    if (prop === 'arguments' || prop === 'caller') {
                        const td = Reflect.getOwnPropertyDescriptor(t, prop);
                        return td === undefined ? undefined : td;
                    }
                    try {
                        const res = origGOPD(t, prop);
                        const td = Reflect.getOwnPropertyDescriptor(t, prop);
                        if (td === undefined && res && res.configurable === false) {
                            return undefined;
                        }
                        return res;
                    } catch (e) {
                        return Reflect.getOwnPropertyDescriptor(t, prop);
                    }
                };
            } else {
                safe.getOwnPropertyDescriptor = function(t, prop) {
                    if (prop === 'arguments' || prop === 'caller') {
                        const td = Reflect.getOwnPropertyDescriptor(t, prop);
                        return td === undefined ? undefined : td;
                    }
                    return Reflect.getOwnPropertyDescriptor(t, prop);
                };
            }

            return safe;
        }

        window.Proxy = function(target, handler) {
            return new _OrigProxy(target, makeSafeHandler(target, handler));
        };
        window.Proxy.revocable = function(target, handler) {
            return _OrigProxy.revocable(target, makeSafeHandler(target, handler));
        };
    }
    {
        if (location.href.includes('cloudconsole') && !window._cloudConsoleFixed) {
            // fix: 云开发 -> 记录列表 -> 右键菜单项目缺少
            let env = undefined
            window._cloudConsoleFixed = true
            Object.defineProperty(window, 'env', {
                set(v) {
                    v.platform = 'linux'
                    env = v
                },
                get() {
                    return env
                }
            })
        }
    }
    (() => {
        if (window.require) {
            // fix: 代码高亮失效
            const fs = window.require('fs')
            const readFile = fs.readFile
            fs.readFile = function(...args) {
                args[0] = args[0].replace('code/package.nw', 'package.nw')
                return readFile.apply(this, args)
            }
        }
    })();
    if (!window.skylineRequireReplace) {
        window.skylineRequireReplace = true;
        const originalRequire = window.require;
        if (originalRequire) {
            window.require = function (m) {
                if (m.includes("skyline.node")) {
                    // 给native用的
                    globalThis.__sharedMemory = originalRequire(
                        "sharedMemory/sharedMemory.node"
                    );
                }
                return originalRequire(m);
            };
            window.require.cache = originalRequire.cache;
            window.require.extensions = originalRequire.extensions;
            window.require.resolve = originalRequire.resolve;
        }
    }
})();
