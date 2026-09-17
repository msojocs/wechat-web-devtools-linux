/* wechat-devtools linux webview touch focus begin */
;(() => {
    if (process.platform !== "linux") return;

    const prototype = exports.WebviewInstance.prototype;
    const patched = Symbol.for("wechat-devtools.webview-touch-focus");
    if (prototype[patched]) return;

    const setEmulationTouch = prototype.setEmulationTouch;
    prototype.setEmulationTouch = function (enabled, ...args) {
        const view = this.getOriginElement();
        if (enabled && view?.tagName === "WEBVIEW" &&
            view.isConnected && view.hasAttribute("route")) {
            // Chromium shares a touch emulator across the embedded views. If
            // TouchStart itself transfers focus, the old view's blur cancels
            // that new gesture. Focus before enabling mouse-to-touch input.
            // webview.focus() only focuses its contentWindow; focus the actual
            // iframe element to transfer the embedded frame tree's focus.
            // Cached/standby pages occupy the same rectangle. Only the top
            // page may take focus; :hover is unreliable across guest views.
            const { x, y, width, height } = view.getBoundingClientRect();
            if (width > 0 && height > 0 &&
                view.ownerDocument.elementFromPoint(x + width / 2, y + height / 2) === view) {
                view.shadowRoot?.querySelector("iframe")?.focus({ preventScroll: true });
            }
        }
        return setEmulationTouch.call(this, enabled, ...args);
    };
    Object.defineProperty(prototype, patched, { value: true });
})();
/* wechat-devtools linux webview touch focus end */
