(() => {
    const http = require('http')
    const originaleListen = http.Server.prototype.listen
    http.Server.prototype.listen = function(port) {
        if (port == 33233) {
            console.warn('block port of http server:', port)
            return
        }
        return originaleListen.apply(this, [port])
    }
})();