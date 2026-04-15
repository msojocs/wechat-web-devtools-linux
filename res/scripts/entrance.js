(() => {
    const http = require("http");
    const originaleListen = http.Server.prototype.listen;
    http.Server.prototype.listen = function (...args) {
        const port = args[0];
        if (port == 33233) {
            console.warn("[entrance] block port of http server:", port);
            return;
        }
        return originaleListen.apply(this, args);
    };
})();
