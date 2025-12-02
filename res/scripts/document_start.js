(() => {
    {
        if (!window.env) {
            // fix: 云开发 -> 记录列表 -> 右键菜单项目缺少
            let env = undefined
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
