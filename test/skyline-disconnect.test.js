const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { test } = require('node:test')
const { patchHeartbeat } = require('../tools/fix-skyline-heartbeat')

const preload = readFileSync(path.join(__dirname, '../res/scripts/preload.js'), 'utf8')
const main = readFileSync(path.join(__dirname, '../res/scripts/main.js'), 'utf8')
const quietConsole = { log() {}, info() {}, warn() {}, error() {} }

function fixture() {
    const calls = []
    const actions = []
    let callback
    let failure
    let onDispatch = () => {}
    const invoke = (method, args) => {
        calls.push({ method, args })
        if (failure) {
            // The real native client invokes the error callback and still throws.
            callback(failure.message)
            throw failure
        }
    }
    const remote = {}
    for (const method of ['setAttribute', 'removeAttribute', 'addEventListener', 'removeEventListener', 'send']) {
        remote[method] = (...args) => invoke(method, args)
    }
    remote.getWebContentsId = () => { invoke('getWebContentsId', []); return 23 }
    class Controller {
        static connect() {}
        constructor(notify) { callback = notify; this.webview = remote }
        setDialogCallback() {}
        mount() { invoke('mount', []) }
        unmount() { invoke('unmount', []) }
    }
    const document = { createElement() { return {} } }
    const store = { dispatch(action) { actions.push(action); onDispatch(action) } }
    vm.runInNewContext(preload, {
        document, window: {}, console: quietConsole, queueMicrotask,
        require(name) {
            if (name.endsWith('render-client.node')) return { Controller }
            return { default: store }
        },
    })
    const element = document.createElement('webview')
    const local = []
    const instance = {
        __webview__: element,
        webviewManagerService: { mainWebviewService: { showDevTools() {} } },
        mount(...args) { local.push({ method: 'mount', args }) },
        async unmount(...args) {
            await Promise.resolve()
            this.getOriginElement().removeEventListener('ipc-message', callback)
            this.getOriginElement().getWebContentsId()
            local.push({ method: 'unmount', args })
        },
    }
    element.instance = instance
    instance._type = 'skyline_appservice'
    return {
        instance, remote, calls, actions, local,
        fail(error = new Error('Socket is not connected')) { failure = error },
        notify(message) { callback(message) },
        onDispatch(handler) { onDispatch = handler },
    }
}

test('disconnect notification does not reenter a commit; subsequent lifecycle cleanup stays local', async () => {
    const f = fixture()
    assert.equal(f.remote.getWebContentsId(), 114537)
    f.onDispatch(() => {
        // SIMULATOR_LAUNCH_ERROR causes a style update and can unmount the component.
        f.instance.setAttribute('style', 'width: 390px')
        f.instance.unmount(false)
    })
    f.fail()
    assert.doesNotThrow(() => f.remote.send('host___message__', {}))
    assert.equal(f.actions.length, 0)
    const callCount = f.calls.length
    await Promise.resolve()
    const cleanup = f.instance.unmount(false)
    assert.equal(cleanup, f.instance.unmount(false))
    await cleanup
    assert.equal(f.calls.length, callCount, 'no RPCs during disconnected style or listener cleanup')
    assert.equal(f.actions.length, 1)
    assert.equal(f.actions[0].type, 'SIMULATOR_LAUNCH_ERROR')
    assert.match(f.actions[0].data, /连接已断开/)
    assert.deepEqual(f.local, [{ method: 'unmount', args: [false] }])
    f.notify('Peer disconnected')
    f.remote.removeEventListener('ipc-message', () => {})
    f.instance.setAttribute('style', '')
    await Promise.resolve()
    assert.equal(f.actions.length, 1, 'one notification per disconnected controller')
})

test('a disconnect first encountered during a style update does not escape the lifecycle', async () => {
    const f = fixture()
    f.fail(new Error('Connection reset by peer (os error 104)'))
    assert.doesNotThrow(() => f.instance.setAttribute('style', 'height: 844px'))
    await Promise.resolve()
    assert.equal(f.actions.length, 1)
})

test('only the remote appservice is mounted and local asynchronous cleanup is preserved', async () => {
    const f = fixture()
    const container = {}
    f.instance.mount(container)
    assert.deepEqual(f.local[0].args, [], 'do not mount a second local appservice')
    f.instance.setAttribute('preload', 'file:///home/test/preload.js')
    assert.deepEqual(f.calls.find(c => c.method === 'setAttribute').args,
        ['preload', 'file:///Z:/home/test/preload.js'])
    await f.instance.unmount(false)
    assert.equal(f.local[1].args[0], false)
    assert.equal(f.calls.at(-1).method, 'unmount', 'remote unmount follows local event cleanup')
})

test('errors unrelated to a lost connection still propagate', async () => {
    const f = fixture()
    const error = new TypeError('Invalid style argument')
    f.fail(error)
    assert.throws(() => f.instance.setAttribute('style', {}), e => e === error)
    await Promise.resolve()
    assert.equal(f.actions[0].data, error.message)
})

test('main webContents lookup treats a disconnected peer as a vanished window', () => {
    let failure
    const local = { id: 5 }
    const remote = { id: 23 }
    const webContents = { fromId: () => local }
    const mainController = { connect() {}, electron: { webContents: {
        fromId() { if (failure) throw failure; return remote },
    } } }
    vm.runInNewContext(main, {
        console: quietConsole,
        require(name) { return name === 'electron' ? { webContents } : { mainController } },
    })
    assert.equal(webContents.fromId(5), local)
    assert.equal(webContents.fromId(114537), remote)
    failure = new Error('Socket is not connected')
    assert.equal(webContents.fromId(114537), undefined)
    assert.equal(webContents.fromId(5), local)
    failure = new TypeError('Invalid remote ID')
    assert.throws(() => webContents.fromId(114537), e => e === failure)
})

function heartbeatFixture(heartBeat) {
    let callback
    let stopped = 0
    let busy = 0
    const errors = []
    // Execute the timer's contract, including the existing hung-renderer counter.
    const source = 'let S={current:null},v={current:{debuggerPaused:false}},I={current:{heartBeat}},e=0;S.current=setInterval(()=>{!v.current.debuggerPaused&&I.current&&(e++,I.current.heartBeat().then(()=>{e=0}),e>=10&&(clearInterval(S.current),N()))},3e3)'
    vm.runInNewContext(patchHeartbeat(source), {
        heartBeat, setInterval(fn) { callback = fn; return 1 },
        clearInterval(id) { assert.equal(id, 1); stopped++ }, N() { busy++ },
        console: { error(...args) { errors.push(args) } },
    })
    return { tick() { callback() }, state() { return { stopped, busy, errors } } }
}

test('heartbeat stops on disconnection without reporting a hung appservice', async () => {
    const f = heartbeatFixture(() => Promise.reject(new Error('Socket is not connected')))
    f.tick()
    await new Promise(resolve => setImmediate(resolve))
    assert.deepEqual(f.state(), { stopped: 1, busy: 0, errors: [] })
})

test('healthy heartbeats keep running, and truly pending heartbeats retain timeout detection', async () => {
    const healthy = heartbeatFixture(() => Promise.resolve(true))
    for (let i = 0; i < 12; i++) { healthy.tick(); await Promise.resolve() }
    assert.equal(healthy.state().stopped, 0)
    const hung = heartbeatFixture(() => new Promise(() => {}))
    for (let i = 0; i < 10; i++) hung.tick()
    assert.equal(hung.state().busy, 1)
})

test('heartbeat reports other failures and packaging rejects an unknown vendor layout', async () => {
    const error = new Error('Unexpected appservice failure')
    const f = heartbeatFixture(() => Promise.reject(error))
    f.tick()
    await new Promise(resolve => setImmediate(resolve))
    assert.equal(f.state().stopped, 0)
    assert.equal(f.state().errors[0][1], error)
    assert.throws(() => patchHeartbeat('unrecognized source'), /Expected one/)
    const source = 'S.current=setInterval(()=>{I.current.heartBeat().then(()=>{e=0})},3e3)'
    assert.equal(patchHeartbeat(patchHeartbeat(source)), patchHeartbeat(source))
})
