const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const childProcess = require('node:child_process');
const { test } = require('node:test');
const { runSkillAuth } = require('../res/scripts/skill-auth');

function mockLaunch(t, handle, launchError) {
    const original = childProcess.spawn;
    const installPath = global.installPath;
    global.installPath = '/test/app.asar';
    t.after(() => { childProcess.spawn = original; global.installPath = installPath; });
    childProcess.spawn = (command, args, options) => {
        const child = new EventEmitter();
        child.unref = () => {};
        queueMicrotask(() => {
            if (!launchError) child.emit('spawn');
            handle(new URL(args[1])).then(() => {
                if (launchError) child.emit('error', new Error(launchError));
            }).catch(error => child.emit('error', error));
        });
        assert.equal(options.env.ELECTRON_RUN_AS_NODE, undefined);
        return child;
    };
}

test('callback rejects invalid requests before accepting the matching task', async t => {
    const statuses = [];
    mockLaunch(t, async url => {
        const taskId = url.searchParams.get('taskId');
        const endpoint = `http://127.0.0.1:${url.searchParams.get('callbackPort')}/skill/auth/callback/${taskId}`;
        statuses.push((await fetch(endpoint)).status);
        for (const body of ['{', JSON.stringify({ taskId: 'wrong' }), 'x'.repeat(65537)]) {
            statuses.push((await fetch(endpoint, { method: 'POST', body })).status);
        }
        await fetch(endpoint, { method: 'POST', body: JSON.stringify({ taskId, ok: true, authorized: true }) });
    });
    const result = await runSkillAuth('Codex', 2000);
    assert.equal(result.authorized, true);
    assert.deepEqual(statuses, [404, 400, 400, 413]);
});

test('authorization timeout closes its listener', async t => {
    let port;
    mockLaunch(t, async url => { port = url.searchParams.get('callbackPort'); });
    const result = await runSkillAuth('Codex', 30);
    assert.equal(result.errorType, 'CONNECT_ERROR');
    assert.match(result.message, /timeout/);
    await assert.rejects(fetch(`http://127.0.0.1:${port}`));
});

test('launch failure clears the callback timeout and closes its listener', async t => {
    let port;
    mockLaunch(t, async url => {
        port = url.searchParams.get('callbackPort');
    }, 'launch failed');
    const result = await runSkillAuth('Codex', 30000);
    assert.equal(result.errorType, 'CONNECT_ERROR');
    assert.equal(result.message, 'launch failed');
    await assert.rejects(fetch(`http://127.0.0.1:${port}`));
});
