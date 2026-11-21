(() => {
    process.argv[0] = 'wechat-devtools-cli'
    // bin/node 把参数整理成 [electron, <脚本>, --electron, ...]，而 CLI 看到 --electron 时按
    // electron 的启动形式 [electron, ., <脚本>, --electron, ...] 从 argv[4] 开始取参数，
    // 少了 '.' 这一位会吞掉第一个参数（如 cli auto 只打印帮助）。这里补上。
    if (process.argv[2] === '--electron') {
        process.argv.splice(1, 0, '.')
    }
    const os = require('os')
    const path = require('path')
    process.env.USERPROFILE = os.homedir()
    // 数据目录和 bin/wechat-devtools 保持一致：优先 XDG_CONFIG_HOME，其次 ~/.config
    const configDir = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config')
    Object.defineProperty(global, 'userDirPath', {
        set: function(value) {
            if (value.includes('AppData/Local')) {
                value = value.replace(/^.*AppData\/Local/, configDir)
                // 应用的数据目录是 <userData>/app，profile 目录是 <userData>/app/Default，
                // 而 CLI 要读写的 .cli/.ide-status 就在 profile 目录下
                value = value.replace(/User Data\/(?:[^/]+\/)?/, 'app/')
                // value = value.replace('~', require('os').homedir())
            }
            this._userDirPath = value
        },
        get: function() {
            return this._userDirPath
        }
    })
    // appPath
    Object.defineProperty(global, 'appPath', {
        set: function(value) {
            if (value.includes('.exe')) {
                value = value.replace('.exe', '')
            }
            this._appPath = value
        },
        get: function() {
            return this._appPath
        }
    })
})();