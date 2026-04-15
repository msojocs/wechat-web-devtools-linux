(() => {
    const http = require("http");
    const originaleListen = http.Server.prototype.listen;
    http.Server.prototype.listen = function (...args) {
        if (port == 33233) {
            const port = args[0];
            console.warn("[entrance] block port of http server:", port);
            return;
        }
        return originaleListen.apply(this, args);
    };
})();
