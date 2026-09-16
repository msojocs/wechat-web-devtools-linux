const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const path = require('node:path')
const { test } = require('node:test')
const vm = require('node:vm')
const { patchTouchLifecycle } = require('../tools/fix-skyline-touch')

const patch = readFileSync(path.join(__dirname, '../res/scripts/skyline-touch.js'), 'utf8')

function fixture() {
    const calls = []
    const window = new EventTarget()
    const document = new EventTarget()
    document.visibilityState = 'visible'
    class SkylineRenderer {
        constructor(id = 4) { this.id = id }
        installEventListener(...args) { this.listenerArgs = args; return 'installed' }
        dispatchEvent(name, args) {
            calls.push({ id: this.id, name, args: Array.from(args) })
            return name
        }
    }
    window.SkylineRenderer = SkylineRenderer
    const context = vm.createContext({ window, document })
    vm.runInContext(patch, context)
    const renderer = new SkylineRenderer()
    assert.equal(renderer.installEventListener('original-options'), 'installed')
    return {
        calls, renderer, window, document, context, SkylineRenderer,
        send(name, ...args) { return renderer.dispatchEvent(name, args) },
        names() { return calls.map(call => call.name) },
    }
}

test('complete taps and drags keep their order, coordinates and compatible click', () => {
    const f = fixture()
    f.send('touchStart', 180, 600)
    f.send('touchMove', 185, 400)
    f.send('touchEnd', 185, 390)
    f.send('click', 375, 350)
    assert.deepEqual(f.calls, [
        { id: 4, name: 'touchStart', args: [180, 600] },
        { id: 4, name: 'touchMove', args: [185, 400] },
        { id: 4, name: 'touchEnd', args: [185, 390] },
        { id: 4, name: 'click', args: [375, 350] },
    ])
    assert.deepEqual(f.renderer.listenerArgs, ['original-options'])
})

test('an unfinished scroll is cancelled before the next letter contact', () => {
    const f = fixture()
    f.send('touchStart', 180, 600)
    f.send('touchMove', 180, 300)
    // The first contact loses touchend. The letter still starts a new contact.
    f.send('touchStart', 375, 350)
    f.send('touchEnd', 375, 350)
    f.send('click', 375, 350)
    f.send('touchStart', 180, 600)
    f.send('touchMove', 180, 300)
    f.send('touchEnd', 180, 300)
    assert.deepEqual(f.names(), [
        'touchStart', 'touchMove', 'touchCancel', 'touchStart', 'touchEnd', 'click',
        'touchStart', 'touchMove', 'touchEnd',
    ])
    assert.deepEqual(f.calls[2].args, [])
})

test('a mouse-compatible click also terminates an unfinished contact', () => {
    const f = fixture()
    f.send('touchStart', 180, 600)
    f.send('touchMove', 180, 300)
    f.send('click', 375, 350)
    assert.deepEqual(f.names(), ['touchStart', 'touchMove', 'touchCancel', 'click'])
})

test('repeated starts cannot leave multiple contacts active', () => {
    const f = fixture()
    for (let i = 0; i < 4; i++) f.send('touchStart', 180, 600 - i)
    f.send('touchEnd', 180, 596)
    assert.deepEqual(f.names(), [
        'touchStart', 'touchCancel', 'touchStart', 'touchCancel',
        'touchStart', 'touchCancel', 'touchStart', 'touchEnd',
    ])
})

test('window blur cancels once; trailing moves and release do not resurrect the gesture', () => {
    const f = fixture()
    f.send('touchStart', 180, 600)
    f.send('touchMove', 180, 500)
    f.window.dispatchEvent(new Event('blur'))
    f.window.dispatchEvent(new Event('blur'))
    f.send('touchMove', 180, 400)
    f.send('touchEnd', 180, 400)
    f.send('touchCancel')
    f.send('touchStart', 180, 600)
    f.send('touchEnd', 180, 600)
    assert.deepEqual(f.names(), ['touchStart', 'touchMove', 'touchCancel', 'touchStart', 'touchEnd'])
})

test('page hide and hidden visibility terminate the active contact, including bfcache transitions', () => {
    for (const reason of ['pagehide', 'visibilitychange']) {
        const f = fixture()
        f.send('touchStart', 180, 600)
        f.document.dispatchEvent(new Event('visibilitychange'))
        assert.deepEqual(f.names(), ['touchStart'])
        if (reason === 'pagehide') f.window.dispatchEvent(new Event('pagehide'))
        else {
            f.document.visibilityState = 'hidden'
            f.document.dispatchEvent(new Event('visibilitychange'))
        }
        f.document.visibilityState = 'visible'
        f.send('touchStart', 180, 600)
        f.send('touchEnd', 180, 600)
        assert.deepEqual(f.names(), ['touchStart', 'touchCancel', 'touchStart', 'touchEnd'])
    }
})

test('IME element blur and scrolling pointercancel do not interrupt touch events', () => {
    const f = fixture()
    f.send('touchStart', 180, 600)
    f.document.dispatchEvent(new Event('blur'))
    const elementBlur = new Event('blur')
    Object.defineProperty(elementBlur, 'target', { value: { tagName: 'TEXTAREA' } })
    f.window.dispatchEvent(elementBlur)
    f.window.dispatchEvent(new Event('pointercancel'))
    f.document.dispatchEvent(new Event('pointercancel'))
    f.send('touchMove', 180, 400)
    f.send('touchEnd', 180, 400)
    assert.deepEqual(f.names(), ['touchStart', 'touchMove', 'touchEnd'])
})

test('explicit touchcancel terminates once and ignores a stale release', () => {
    const f = fixture()
    f.send('touchStart', 180, 600)
    f.send('touchCancel')
    f.send('touchMove', 180, 400)
    f.send('touchEnd', 180, 400)
    assert.deepEqual(f.names(), ['touchStart', 'touchCancel'])
})

test('non-touch input preserves arguments and return values', () => {
    const f = fixture()
    const cases = [['keyboard', 65, 65, 1, 0], ['char', 0x4e2d], ['wheel', 180, 400, 0, 200], ['mousemove', 180, 400]]
    for (const [name, ...args] of cases) assert.equal(f.send(name, ...args), name)
    assert.deepEqual(f.calls.map(({ name, args }) => [name, ...args]), cases)
})

test('state belongs to each renderer and reinstalling does not double-wrap it', () => {
    const f = fixture()
    const other = new f.SkylineRenderer(7)
    other.installEventListener()
    f.send('touchStart', 180, 600)
    other.dispatchEvent('touchStart', [180, 600])
    const dispatch = f.renderer.dispatchEvent
    vm.runInContext(patch, f.context)
    assert.equal(f.renderer.dispatchEvent, dispatch)
    f.send('touchStart', 375, 350)
    other.dispatchEvent('touchEnd', [180, 600])
    assert.deepEqual(f.calls.map(({ id, name }) => [id, name]), [
        [4, 'touchStart'], [7, 'touchStart'], [4, 'touchCancel'], [4, 'touchStart'], [7, 'touchEnd'],
    ])
})

const upstream = `(() => {
    class E {
        installEventListener() {}
        dispatchEvent(name, args) { window.sent.push([name, Array.from(args)]) }
    }
    window.SkylineRenderer=E
})();
//# sourceURL=ide:///extensions/skyline/index.js
`

test('packaging installs synchronously after the class, before any renderer is created', () => {
    const source = patchTouchLifecycle(upstream)
    const window = new EventTarget()
    window.sent = []
    const document = new EventTarget()
    vm.runInNewContext(source, { window, document })
    const renderer = new window.SkylineRenderer()
    renderer.installEventListener()
    renderer.dispatchEvent('touchStart', [180, 600])
    renderer.dispatchEvent('touchMove', [180, 300])
    renderer.dispatchEvent('touchStart', [375, 350])
    assert.deepEqual(window.sent.map(([name]) => name), ['touchStart', 'touchMove', 'touchCancel', 'touchStart'])
    assert.equal(patchTouchLifecycle(source), source)
    assert.match(source, /sourceURL=ide:\/\/\/extensions\/skyline\/index.js\n$/)
})

test('packaging replaces the previous patch and rejects incompatible or damaged input', () => {
    const old = upstream.replace('//# sourceURL=',
        '/* skyline-touch-lifecycle begin */\noldPatch();\n/* skyline-touch-lifecycle end */\n//# sourceURL=')
    const patched = patchTouchLifecycle(old)
    assert.ok(!patched.includes('oldPatch()'))
    assert.equal(patched, patchTouchLifecycle(upstream))
    assert.throws(() => patchTouchLifecycle('window.UnrelatedRenderer=E'), /Expected one SkylineRenderer/)
    assert.throws(() => patchTouchLifecycle(upstream + '/* skyline-touch-lifecycle begin */'), /Invalid.*markers/)
    assert.throws(() => patchTouchLifecycle(upstream + 'invalid JS {'), SyntaxError)
})
