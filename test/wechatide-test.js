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
const upstream = path.join(repo, 'resources/app.asar.unpacked');

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
    await exec(process.execPath, [path.join(repo, 'tools/fix-skill-cli.js'), pkg]);
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
    const userDir = path.join(f.env.XDG_CONFIG_HOME, 'wechat-devtools', hash, 'Default');
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
fetch('http://127.0.0.1:' + url.searchParams.get('callbackPort') + '/skill/auth/callback/' + taskId, {
    method: 'POST', body: JSON.stringify(process.env.WECHATIDE_TEST_DENY
        ? { taskId, ok: false, errorType: 'AUTH_DENIED', message: 'Client not authorized' }
        : { taskId, ok: true, authorized: true, status: 'success', alreadyTrusted: true }),
}).catch(() => process.exitCode = 1);
`, { mode: 0o755 });
    const { stdout } = await f.run(['auth', '-c', 'Codex'], { ELECTRON_RUN_AS_NODE: '1' });
    assert.equal(JSON.parse(stdout).authorized, true);
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
});

test('build patch is idempotent and rejects an unrecognized upstream before writing', async t => {
    const f = await fixture(t);
    const entry = path.join(f.pkg, 'js/common/cli/skill-index.js');
    const before = fs.readFileSync(entry, 'utf8');
    await exec(process.execPath, [path.join(repo, 'tools/fix-skill-cli.js'), f.pkg]);
    assert.equal(fs.readFileSync(entry, 'utf8'), before);
    fs.writeFileSync(entry, 'unknown upstream');
    await assert.rejects(exec(process.execPath, [path.join(repo, 'tools/fix-skill-cli.js'), f.pkg]), /Unsupported upstream/);
    assert.equal(fs.readFileSync(entry, 'utf8'), 'unknown upstream');
});

test('Linux installation diagnostics find the source build through PATH', async t => {
    const f = await fixture(t);
    const scripts = path.join(f.pkg, 'wechatide-skill/skills/installer/scripts');
    const { stdout } = await exec(process.execPath, [path.join(scripts, 'check-installation.mjs')], { env: f.env });
    assert.equal(JSON.parse(stdout).compatible, true);
    const linked = await exec(process.execPath, [path.join(scripts, 'ensure-cli-path.mjs'), '--check'], { env: f.env });
    assert.equal(JSON.parse(linked.stdout).commandReady, true);
});
