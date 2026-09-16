// Run after building the upstream resources: node --test test/wechatide-test.js
const assert = require('node:assert/strict');
const { execFile } = require('node:child_process');
const { createHash } = require('node:crypto');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { promisify } = require('node:util');
const { test } = require('node:test');

const exec = promisify(execFile);
const repo = path.resolve(__dirname, '..');
const upstream = process.env.WECHATIDE_TEST_RESOURCES || path.join(repo, 'resources/app.asar.unpacked');

async function fixture(t) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wechatide test '));
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    const pkg = path.join(root, 'resources/app.asar.unpacked');
    fs.mkdirSync(path.join(pkg, 'js/common/cli'), { recursive: true });
    fs.mkdirSync(path.join(root, 'bin'));
    fs.mkdirSync(path.join(root, 'electron'));
    fs.symlinkSync(process.execPath, path.join(root, 'electron/node'));
    fs.symlinkSync('../resources', path.join(root, 'electron/resources'));
    fs.copyFileSync(path.join(upstream, 'js/common/cli/skill-index.js'), path.join(pkg, 'js/common/cli/skill-index.js'));
    fs.copyFileSync(path.join(upstream, 'package.json'), path.join(pkg, 'package.json'));
    fs.cpSync(path.join(upstream, 'wechatide-skill'), path.join(pkg, 'wechatide-skill'), { recursive: true });
    fs.copyFileSync(path.join(repo, 'bin/wechatide'), path.join(root, 'bin/wechatide'));
    const env = { ...process.env, XDG_CONFIG_HOME: path.join(root, 'config dir'), PATH: `${root}/bin:${process.env.PATH}` };
    const entry = path.join(pkg, 'js/common/cli/skill-index.js');
    const original = fs.readFileSync(entry);
    const shared = path.join(pkg, 'wechatide-skill/skills/installer/scripts/install-root.mjs');
    const sharedBefore = fs.readFileSync(shared);
    const installer = path.dirname(shared);
    const downloadBefore = fs.readFileSync(path.join(installer, 'resolve-download.mjs'));
    const originals = ['check-installation', 'ensure-cli-path'].map(name => {
        const preserved = path.join(installer, `${name}.upstream.mjs`);
        return fs.readFileSync(fs.existsSync(preserved) ? preserved : path.join(installer, `${name}.mjs`));
    });
    await exec(process.execPath, [path.join(repo, 'tools/fix-skill-cli.js'), pkg]);
    assert.deepEqual(fs.readFileSync(entry), original, 'installer must leave the CLI bundle untouched');
    assert.deepEqual(fs.readFileSync(shared), sharedBefore, 'shared installer module must remain untouched');
    assert.deepEqual(fs.readFileSync(path.join(installer, 'resolve-download.mjs')), downloadBefore);
    ['check-installation', 'ensure-cli-path'].forEach((name, index) => {
        assert.deepEqual(fs.readFileSync(path.join(installer, `${name}.upstream.mjs`)), originals[index]);
    });
    const run = (args, extraEnv = {}) => exec(path.join(root, 'bin/wechatide'), args, { env: { ...env, ...extraEnv }, timeout: 10000 });
    return { root, pkg, env, run };
}

test('entry resolves symlinks and forwards arguments without shell expansion', async t => {
    const f = await fixture(t);
    const link = path.join(f.root, 'wechatide link');
    fs.symlinkSync('bin/wechatide', link);
    const project = path.join(f.root, 'project with spaces $literal');
    const { stdout } = await exec(link, ['-c', 'Codex', 'automation_runtime_info', '--project', project, '--action', 'currentPage'], {
        env: { ...f.env, SKILL_CLI_DUMP_ARGS: '1' },
    });
    assert.ok(stdout.includes(project));
    assert.ok(stdout.includes('currentPage'));
    const { stdout: help } = await f.run(['project_list', '--help']);
    assert.match(help, /Tool: project_list/);
    await assert.rejects(f.run(['-c', 'Codex', 'automation_runtime_info']), error => {
        assert.equal(error.code, 1);
        assert.match(error.stdout, /missing_required/);
        return true;
    });
});

test('entry discovers the Linux IDE port and calls the original MCP client', async t => {
    const f = await fixture(t);
    const requests = [];
    const server = http.createServer(async (req, res) => {
        res.setHeader('content-type', 'application/json');
        if (req.method !== 'POST') return res.end(JSON.stringify({ ok: true }));
        let body = '';
        for await (const chunk of req) body += chunk;
        const message = JSON.parse(body);
        requests.push(message);
        res.setHeader('mcp-session-id', 'test-session');
        const result = message.method === 'initialize' ? {} : {
            content: [{ type: 'text', text: JSON.stringify({ success: true, scope: message.params.arguments.scope }) }],
        };
        res.end(JSON.stringify({ jsonrpc: '2.0', id: message.id, result }));
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    t.after(() => server.close());
    const appPath = path.join(f.root, 'electron/resources/app.asar');
    const hash = createHash('md5').update(appPath).digest('hex');
    const userDir = path.join(f.env.XDG_CONFIG_HOME, JSON.parse(fs.readFileSync(path.join(f.pkg, 'package.json'))).name, hash, 'Default');
    fs.mkdirSync(userDir, { recursive: true });
    fs.writeFileSync(path.join(userDir, '.ide'), String(server.address().port));
    const { stdout } = await f.run(['-c', 'Codex', 'project_list', '--scope', 'all']);
    assert.equal(JSON.parse(stdout).result.scope, 'all');
    assert.equal(requests[0].params.clientInfo.name, 'Codex');
    assert.equal(requests[1].params.name, 'project_list');
});

test('Linux auth launches Electron with the scheme URL and handles the callback', async t => {
    const f = await fixture(t);
    const capture = path.join(f.root, 'auth-launch.json');
    // Mock only the desktop process boundary; the upstream CLI creates and validates its callback.
    fs.writeFileSync(path.join(f.root, 'electron/electron'), `#!${process.execPath}
const fs = require('node:fs');
fs.writeFileSync(${JSON.stringify(capture)}, JSON.stringify({ args: process.argv.slice(2), runAsNode: process.env.ELECTRON_RUN_AS_NODE }));
const url = new URL(process.argv[3]);
const taskId = url.searchParams.get('taskId');
if (process.env.WECHATIDE_TEST_IDE_FILE) {
    fs.mkdirSync(require('node:path').dirname(process.env.WECHATIDE_TEST_IDE_FILE), { recursive: true });
    fs.writeFileSync(process.env.WECHATIDE_TEST_IDE_FILE, process.env.WECHATIDE_TEST_IDE_PORT);
}
fetch('http://127.0.0.1:' + url.searchParams.get('callbackPort') + '/skill/auth/callback/' + taskId, {
    method: 'POST', body: JSON.stringify(process.env.WECHATIDE_TEST_DENY
        ? { taskId, ok: false, errorType: 'AUTH_DENIED', message: 'Client not authorized' }
        : process.env.WECHATIDE_TEST_PENDING ? { taskId, ok: true, status: 'pending', port: 12345 } : { taskId, ok: true, authorized: true, status: 'success', alreadyTrusted: true }),
}).catch(() => process.exitCode = 1);
`, { mode: 0o755 });
    const { stdout } = await f.run(['auth', '-c', 'Codex'], { ELECTRON_RUN_AS_NODE: '1' });
    assert.equal(JSON.parse(stdout).authorized, true);
    const pending = await f.run(['-c', 'Codex', 'project_list'], { WECHATIDE_TEST_PENDING: '1' });
    assert.match(pending.stdout, /Waiting for user authorization/);
    await assert.rejects(f.run(['-c', 'Codex', 'project_list'], { WECHATIDE_TEST_DENY: '1' }), error => {
        assert.match(error.stdout, /AUTH_DENIED/);
        return true;
    });
    const launch = JSON.parse(fs.readFileSync(capture));
    assert.equal(launch.args[0], path.join(f.root, 'electron/resources/app.asar'));
    assert.match(launch.args[1], /^wechatide:\/\/skill\/auth\?/);
    assert.equal(launch.args[2], '--cli');
    assert.equal(launch.runAsNode, undefined);
    await assert.rejects(f.run(['auth', '-c', 'Codex'], { WECHATIDE_TEST_DENY: '1' }), error => {
        assert.equal(error.code, 1);
        assert.match(error.stdout, /AUTH_DENIED/);
        return true;
    });
    // 自动授权成功后，原 CLI 必须重新发现服务并重试原工具调用。
    const methods = [];
    const ide = http.createServer(async (req, res) => {
        res.setHeader('content-type', 'application/json');
        if (req.method !== 'POST') return res.end(JSON.stringify({ ok: true }));
        let body = '';
        for await (const chunk of req) body += chunk;
        const message = JSON.parse(body);
        methods.push(message.method);
        const result = message.method === 'initialize' ? {} : {
            content: [{ type: 'text', text: JSON.stringify({ success: true, afterAuth: true }) }],
        };
        res.end(JSON.stringify({ jsonrpc: '2.0', id: message.id, result }));
    });
    await new Promise(resolve => ide.listen(0, '127.0.0.1', resolve));
    t.after(() => ide.close());
    const hash = createHash('md5').update(path.join(f.root, 'electron/resources/app.asar')).digest('hex');
    const retried = await f.run(['-c', 'Codex', 'project_list'], {
        WECHATIDE_TEST_IDE_FILE: path.join(f.env.XDG_CONFIG_HOME, JSON.parse(fs.readFileSync(path.join(f.pkg, 'package.json'))).name, hash, 'Default/.ide'),
        WECHATIDE_TEST_IDE_PORT: String(ide.address().port),
    });
    assert.equal(JSON.parse(retried.stdout).result.afterAuth, true);
    assert.deepEqual(methods, ['initialize', 'tools/call']);

});

test('Linux installation diagnostics find the source build through PATH', async t => {
    const f = await fixture(t);
    const scripts = path.join(f.pkg, 'wechatide-skill/skills/installer/scripts');
    const { stdout } = await exec(process.execPath, [path.join(scripts, 'check-installation.mjs')], { env: f.env });
    assert.equal(JSON.parse(stdout).compatible, true);
    const linked = await exec(process.execPath, [path.join(scripts, 'ensure-cli-path.mjs'), '--check'], { env: f.env });
    assert.equal(JSON.parse(linked.stdout).commandReady, true);
});

test('unknown CLI export layout fails clearly', async t => {
    const f = await fixture(t);
    fs.writeFileSync(path.join(f.pkg, 'js/common/cli/skill-index.js'), 'module.exports = {};');
    await assert.rejects(f.run(['auth', '-c', 'Codex']), error => {
        assert.match(error.stderr, /Unsupported wechatide auth exports/);
        return true;
    });
});

test('export interception restores native API and removes unused accessors', async t => {
    const f = await fixture(t);
    fs.writeFileSync(path.join(f.pkg, 'js/common/cli/skill-index.js'), `
const nativeDefine = Object.defineProperty;
const unrelated = {};
Object.defineProperty(unrelated, '__esModule', { value: true });
const auth = {};
Object.defineProperty(auth, '__esModule', { value: true });
auth.parseSkillAuthArgs = () => {};
auth.runSkillAuth = () => {};
auth.startSkillAuth = () => {};
const output = {};
Object.defineProperty(output, '__esModule', { value: true });
output.emitSkillCallFailure = () => {};
setImmediate(() => {
    const result = {
        restored: Object.defineProperty !== nativeDefine,
        unrelatedClean: !Object.hasOwn(unrelated, 'runSkillAuth') && !Object.hasOwn(unrelated, 'emitSkillCallFailure'),
        authClean: !Object.hasOwn(auth, 'emitSkillCallFailure'),
    };
    process.stdout.write(JSON.stringify(result));
});
`);
    const { stdout } = await f.run([]);
    assert.deepEqual(JSON.parse(stdout), { restored: true, unrelatedClean: true, authClean: true });
});

test('installer updates are idempotent and validate before writing', async t => {
    const f = await fixture(t);
    const installer = path.join(f.pkg, 'wechatide-skill/skills/installer/scripts');
    const files = [
        path.join(installer, 'install-root.mjs'),
        path.join(installer, 'ensure-cli-path.mjs'),
        path.join(installer, 'check-installation.upstream.mjs'),
        path.join(installer, 'ensure-cli-path.upstream.mjs'),
        path.join(f.pkg, 'js/common/cli/skill-index.js'),
        path.join(f.pkg, 'js/common/cli/linux/skill-cli.js'),
        path.join(f.pkg, 'js/common/cli/linux/skill-auth.js'),
    ];
    const before = files.map(file => fs.readFileSync(file));
    await exec(process.execPath, [path.join(repo, 'tools/fix-skill-cli.js'), f.pkg]);
    files.forEach((file, index) => assert.deepEqual(fs.readFileSync(file), before[index]));
    fs.unlinkSync(files[1]);
    await assert.rejects(exec(process.execPath, [path.join(repo, 'tools/fix-skill-cli.js'), f.pkg]), /ENOENT/);
    assert.deepEqual(fs.readFileSync(files[0]), before[0]);
    assert.deepEqual(fs.readFileSync(files[4]), before[4]);
});

async function installerRun(f, name, args = [], env = {}) {
    const script = path.join(f.pkg, 'wechatide-skill/skills/installer/scripts', `${name}.mjs`);
    return exec(process.execPath, [script, ...args], { env: { ...f.env, ...env }, timeout: 10000 });
}

test('non-Linux entry calls preserve upstream behavior', async t => {
    const f = await fixture(t);
    for (const platform of ['darwin', 'win32']) {
        const args = ['--platform', platform, '--install-root', f.root];
        const official = await installerRun(f, 'check-installation.upstream', args);
        const adapted = await installerRun(f, 'check-installation', args);
        assert.equal(adapted.stdout, official.stdout);
        const capture = async name => {
            try { return await installerRun(f, name, [...args, '--check']); }
            catch (error) { return error; }
        };
        const originalEnsure = await capture('ensure-cli-path.upstream');
        const wrappedEnsure = await capture('ensure-cli-path');
        assert.equal(wrappedEnsure.stdout, originalEnsure.stdout);
        assert.equal(wrappedEnsure.code, originalEnsure.code);
    }
});

test('Linux path check is read-only and linking stays in user bin', async t => {
    const f = await fixture(t);
    const home = path.join(f.root, 'home');
    const env = { HOME: home, PATH: '/usr/bin:/bin' };
    const args = ['--install-root', f.root];
    await assert.rejects(installerRun(f, 'ensure-cli-path', [...args, '--check'], env), error => {
        assert.equal(JSON.parse(error.stdout).action, 'needs_link');
        return true;
    });
    assert.equal(fs.existsSync(home), false);
    const created = JSON.parse((await installerRun(f, 'ensure-cli-path', args, env)).stdout);
    assert.equal(created.action, 'linked');
    assert.equal(created.commandReady, false);
    const link = path.join(home, '.local/bin/wechatide');
    assert.equal(fs.readlinkSync(link), path.join(f.root, 'bin/wechatide'));
    assert.deepEqual(fs.readdirSync(home), ['.local']);
    const ready = await installerRun(f, 'ensure-cli-path', [...args, '--check'], { ...env, PATH: `${home}/.local/bin:${env.PATH}` });
    assert.equal(JSON.parse(ready.stdout).commandReady, true);
    fs.unlinkSync(link);
    fs.writeFileSync(link, 'user-owned command');
    await assert.rejects(installerRun(f, 'ensure-cli-path', args, env), error => {
        assert.equal(JSON.parse(error.stdout).action, 'failed');
        return true;
    });
    assert.equal(fs.readFileSync(link, 'utf8'), 'user-owned command');
    fs.unlinkSync(link);
    fs.symlinkSync('/missing/other-wechatide', link);
    await assert.rejects(installerRun(f, 'ensure-cli-path', args, env));
    assert.equal(fs.readlinkSync(link), '/missing/other-wechatide');
});

test('Linux checks preserve runtime and version compatibility gates', async t => {
    const f = await fixture(t);
    const args = ['--install-root', f.root];
    const explicit = JSON.parse((await installerRun(f, 'check-installation', ['--install-root', path.join(f.root, 'electron')])).stdout);
    assert.equal(explicit.compatible, true);
    const packageFile = path.join(f.pkg, 'package.json');
    const metadata = JSON.parse(fs.readFileSync(packageFile));
    fs.writeFileSync(packageFile, JSON.stringify({ ...metadata, version: '1.0.0' }));
    assert.equal(JSON.parse((await installerRun(f, 'check-installation', args)).stdout).reason, 'electron_version_too_old');
    fs.writeFileSync(packageFile, '{');
    assert.equal(JSON.parse((await installerRun(f, 'check-installation', args)).stdout).reason, 'electron_version_unreadable');
    fs.writeFileSync(packageFile, JSON.stringify(metadata));
    fs.unlinkSync(path.join(f.root, 'bin/wechatide'));
    assert.equal(JSON.parse((await installerRun(f, 'check-installation', args)).stdout).reason, 'wechatide_missing');
    const nw = path.join(f.root, 'code/package.nw');
    fs.mkdirSync(nw, { recursive: true });
    fs.writeFileSync(path.join(nw, 'package.json'), '{}');
    assert.equal(JSON.parse((await installerRun(f, 'check-installation', args)).stdout).reason, 'nw_runtime_incompatible');
    await assert.rejects(installerRun(f, 'check-installation', ['--install-root']), /缺少值/);
    await assert.rejects(installerRun(f, 'check-installation', ['--check']), /未知参数/);
});
