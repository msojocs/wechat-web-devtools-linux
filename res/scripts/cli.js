(() => {
    process.argv[0] = 'wechat-devtools-cli'
    process.env.USERPROFILE = require('os').homedir()
    Object.defineProperty(global, 'userDirPath', {
        set: function(value) {
            if (value.includes('AppData/Local')) {
                value = value.replace('AppData/Local', '.config')
                value = value.replace(/User Data\/.*?\//, '')
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