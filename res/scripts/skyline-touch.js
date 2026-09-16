;(() => {
    // The Skyline bridge carries one contact (x/y), without a touch identifier.
    // A lost DOM touchend must not leave an older native drag alive when the
    // next contact or the mouse-compatible click arrives.
    const prototype = window.SkylineRenderer.prototype
    const marker = Symbol.for('wechat-devtools.skyline.touch-lifecycle')
    if (prototype[marker]) return

    const dispatch = prototype.dispatchEvent
    const installEventListener = prototype.installEventListener
    const states = new WeakMap()
    const stateFor = renderer => {
        let state = states.get(renderer)
        if (!state) {
            state = { active: false, listening: false }
            states.set(renderer, state)
        }
        return state
    }
    const cancel = renderer => {
        const state = stateFor(renderer)
        if (!state.active) return
        state.active = false
        return dispatch.call(renderer, 'touchCancel', [])
    }

    prototype.dispatchEvent = function (name, args) {
        const state = stateFor(this)
        if (name === 'touchStart' || name === 'click') cancel(this)

        if (name === 'touchStart') {
            state.active = true
        } else if (name === 'touchMove') {
            if (!state.active) return
        } else if (name === 'touchEnd' || name === 'touchCancel') {
            if (!state.active) return
            state.active = false
        }
        return dispatch.call(this, name, args)
    }

    prototype.installEventListener = function (...args) {
        const state = stateFor(this)
        if (!state.listening) {
            state.listening = true
            // Listen to window blur only. The IME textarea changes focus during
            // normal input; those element blur events must not cancel a drag.
            window.addEventListener('blur', event => {
                if (event.target === window) cancel(this)
            })
            window.addEventListener('pagehide', () => cancel(this))
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'hidden') cancel(this)
            })
            // Do not cancel on pointercancel: Chromium emits it when a native
            // scroll begins, while touchmove/touchend continue to be delivered.
        }
        return installEventListener.apply(this, args)
    }
    Object.defineProperty(prototype, marker, { value: true })
})()
