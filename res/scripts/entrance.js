(() => {
    const http = require('http')
    const originaleListen = http.Server.prototype.listen
    http.Server.prototype.listen = function(...args) {
        if (args[0] == 33233) {
            console.warn('block port of http server:', args[0])
            return
        }
        return originaleListen.apply(this, args)
    }
})();