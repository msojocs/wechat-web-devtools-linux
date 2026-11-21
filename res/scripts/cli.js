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
    // IDE 未启动时，CLI 会用 process.execPath（electron 本体）加 --cli 参数启动 IDE，
    // 但没有传入应用目录和 --no-sandbox，electron 启动后什么也不做，CLI 一直等不到 IDE 端口。
    // 改为调用 bin/wechat-devtools 启动脚本，由它补齐参数和环境变量。
    const childProcess = require('child_process')
    const originalSpawn = childProcess.spawn
    const launcher = process.env.WECHAT_DEVTOOLS_DIR
        ? path.join(process.env.WECHAT_DEVTOOLS_DIR, '../bin/wechat-devtools')
        : ''
    childProcess.spawn = function(command, args, options) {
        if (launcher && command === process.execPath && Array.isArray(args) && args.includes('--cli')) {
            command = launcher
        }
        return originalSpawn.call(this, command, args, options)
    }
})();
