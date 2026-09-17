/* wechat-devtools linux webview mouse leave begin */
;(() => {
    if (process.platform !== "linux") return;

    const prototype = exports.WebviewManagerServiceMain.prototype;
    const patched = Symbol.for("wechat-devtools.webview-mouse-leave");
    if (prototype[patched]) return;

    const { BrowserWindow } = require("electron");
    const setEmulationTouch = prototype.setEmulationTouch;
    const states = new WeakMap();
    const watched = new WeakSet();
    const contains = (rect, point) => rect && point && point.x >= rect.x &&
        point.y >= rect.y && point.x < rect.x + rect.width && point.y < rect.y + rect.height;

    // Runs in the host renderer. The phone chrome and the embedded page have
    // different frame trees; each must own focus before its first TouchStart.
    function phoneAtPoint(x, y, focusId) {
        const target = document.elementFromPoint(x, y);
        const phone = target?.closest(".simulator");
        const container = phone || document.querySelector(".simulator");
        const rect = container?.getBoundingClientRect().toJSON();
        if (!phone) return { zone: "outside", rect };
        const view = [...phone.querySelectorAll("webview[route]")]
            .filter(v => v.isConnected && Number(v.parentElement.style.zIndex) >= 0)
            .sort((a, b) => Number(b.parentElement.style.zIndex) - Number(a.parentElement.style.zIndex))[0];
        if (!view) return { zone: "outside", rect };
        const id = view.getWebContentsId();
        const zone = target === view ? "page" : "chrome";
        if (focusId === id) {
            if (zone === "page") {
                view.shadowRoot?.querySelector("iframe")?.focus({ preventScroll: true });
            } else {
                phone.tabIndex = -1;
                phone.focus({ preventScroll: true });
            }
        }
        return { zone, id, rect };
    }

    async function updatePointer(state) {
        if (state.busy || !state.point || state.down || state.host.isDestroyed()) return;
        state.busy = true;
        const point = state.point;
        const revision = state.revision;
        const stale = () => state.point !== point || state.revision !== revision || state.down;
        try {
            const read = focusId => state.host.executeJavaScript(
                `(${phoneAtPoint.toString()})(${point.x}, ${point.y}, ${focusId ?? "undefined"})`);
            const region = await read();
            if (stale()) return;
            state.rect = region.rect;
            if (region.zone === "outside") {
                const active = state.active;
                state.active = null;
                state.zone = "outside";
                if (active) await setEmulationTouch.call(state.service, active, false);
            } else {
                if (state.zone !== region.zone || state.active !== region.id) {
                    const focused = await read(region.id);
                    if (stale() || focused.id !== region.id || focused.zone !== region.zone) return;
                }
                state.zone = region.zone;
                if (state.active !== region.id) {
                    state.active = region.id;
                    await setEmulationTouch.call(state.service, region.id, true);
                }
            }
        } catch (error) {
            if (!state.host.isDestroyed()) console.error("[webview-touch-focus] Phone input update failed", error);
        } finally {
            state.busy = false;
            if (state.point !== point) void updatePointer(state);
        }
    }

    function watch(state, contents) {
        if (watched.has(contents)) return;
        watched.add(contents);
        const onMouse = (_event, input) => {
            if (input.type === "mouseDown") { state.down = true; return; }
            if (input.type === "mouseUp") {
                state.down = false;
                state.zone = null; // A click may resize/reposition the simulator.
                return;
            }
            if (!["mouseMove", "mouseLeave"].includes(input.type) || input.button !== "none" || state.down) return;
            const window = BrowserWindow.fromWebContents(state.host);
            if (!window) return;
            const bounds = window.getContentBounds();
            const zoom = state.host.getZoomFactor();
            const point = { x: (input.globalX - bounds.x) / zoom, y: (input.globalY - bounds.y) / zoom };
            if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return;
            state.point = point;
            // Only boundaries need a renderer round trip. Mouse movement within
            // the current phone region or outside it uses the cached bounds.
            if (input.type === "mouseMove" && state.rect) {
                const inside = contains(state.rect, point);
                if (!inside && !state.active && state.zone === "outside") return;
                if (inside && state.active &&
                    ((contents === state.host && state.zone === "chrome") ||
                     (contents !== state.host && state.zone === "page"))) return;
            }
            void updatePointer(state);
        };
        contents.on("before-mouse-event", onMouse);
        const window = contents === state.host ? BrowserWindow.fromWebContents(contents) : null;
        const invalidate = () => { state.rect = null; state.zone = null; state.revision++; };
        if (window) {
            window.on?.("resize", invalidate);
            contents.on("zoom-changed", invalidate);
        }
        contents.once("destroyed", () => {
            contents.removeListener("before-mouse-event", onMouse);
            window?.removeListener?.("resize", invalidate);
            contents.removeListener("zoom-changed", invalidate);
            if (state.active === contents.id) state.active = null;
            state.revision++;
        });
    }

    prototype.setEmulationTouch = function (id, enabled, ...args) {
        const view = this.tryGetWebContentById(id);
        const host = view?.hostWebContents;
        if (!host || !view.getURL().includes("/__pageframe__/")) {
            return setEmulationTouch.call(this, id, enabled, ...args);
        }
        let state = states.get(host);
        if (!state) {
            state = { host, service: this, active: null, revision: 0, zone: null };
            states.set(host, state);
            watch(state, host);
        }
        watch(state, view);
        if (!enabled && state.active) {
            if (state.active !== id) {
                this.fireTouchModeChangeEvent(id, false);
                return Promise.resolve();
            }
            // Leaving the guest for its title/status bars is still inside the
            // phone. The native host watcher handles the eventual phone exit.
            if (contains(state.rect, state.point)) {
                this.fireTouchModeChangeEvent(id, true);
                return Promise.resolve();
            }
        }
        state.active = enabled ? id : null;
        state.revision++;
        state.zone = null;
        return setEmulationTouch.call(this, id, enabled, ...args);
    };
    Object.defineProperty(prototype, patched, { value: true });
})();
/* wechat-devtools linux webview mouse leave end */
