(() => {
    process.argv[0] = 'wechat-devtools-cli'
    process.env.USERPROFILE = require('os').homedir()
    Object.defineProperty(global, 'userDirPath', {
        set: function(value) {
            if (value.includes('AppData/Local')) {
                value = value.replace('AppData/Local', '.config')
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