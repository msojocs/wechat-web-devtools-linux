
/* patch wechat devtools begin */
// 前置到 js/electron/main.js（electron 主进程入口，package.json 的 main 字段，
// 构建时保留固定路径，不参与内容哈希）
//
// 应用数据目录由两处算出，本来都拼成 <本地数据目录>/<md5(app.asar 绝对路径)>：
//   1. bootstrapAppPaths()：主进程自己的 dataPath/defaultDataPath（nw 兼容层、Crashpad 等）
//   2. dir.config 的 getDataPathSync()：主进程（AppService）、后端进程
//      （DEVTOOLS_USER_DATA_PATH 由主进程 fork 时传入）、渲染进程
//      （窗口 query 里的 userDataPath 由主进程构造）都依赖它
// 这两处代码都在按内容哈希命名的 js/<hash>.js 里，文件名随 devtools 版本变化。
// 这里不动那些文件，而是在主进程入口拦截模块加载，按导出形状（函数名）识别并包装，
// 使数据目录统一为启动脚本 bin/wechat-devtools 约定的 <本地数据目录>/app。
;
(() => {
    try {
        const Module = require("module");
        const path = require("path");

        if (global.__wechatDevtoolsDataPathPatched) {
            return;
        }
        global.__wechatDevtoolsDataPathPatched = true;

        const load = Module._load;
        const patched = new WeakSet();

        function patchModule(exports) {
            const type = typeof exports;
            if ((type !== "object" && type !== "function") || exports === null || patched.has(exports)) {
                return;
            }
            patched.add(exports);

            // dir.config：getDataPathSync() 原本是 join(getLocalDataPath(), md5(...))
            if (typeof exports.getDataPathSync === "function"
                && typeof exports.getLocalDataPath === "function") {
                exports.getDataPathSync = function () {
                    return path.join(exports.getLocalDataPath(), "app");
                };
            }

            // bootstrap：bootstrapAppPaths(app) 的返回值里带 dataPath/defaultDataPath/weappCodePath
            if (typeof exports.bootstrapAppPaths === "function") {
                const bootstrapAppPaths = exports.bootstrapAppPaths;
                exports.bootstrapAppPaths = function () {
                    const result = bootstrapAppPaths.apply(null, arguments);
                    if (!result || typeof result.dataPath !== "string") {
                        return result;
                    }
                    // result.dataPath 形如 <本地数据目录>/<md5>
                    const dataPath = path.join(path.dirname(result.dataPath), "app");
                    result.dataPath = dataPath;
                    result.defaultDataPath = path.join(dataPath, "Default");
                    result.weappCodePath = path.join(dataPath, "WeappCode");
                    return result;
                };
            }
        }

        Module._load = function () {
            const exports = load.apply(this, arguments);
            try {
                patchModule(exports);
            } catch (error) {
                // 某些模块的导出是带 getter 的对象，识别过程出错时不能影响 require 本身
            }
            return exports;
        };
    } catch (error) {
        process.stderr.write(error.message);
        process.stderr.write(error.stack);
    }
})();
/* patch wechat devtools end */
