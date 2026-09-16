// Run against the final source-build output, not a fixture that reinstalls adapters.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const repo = path.resolve(__dirname, '..');
const resources = process.env.WECHATIDE_TEST_RESOURCES || path.join(repo, 'resources/app.asar.unpacked');

test('final build includes the current Linux CLI adapters', () => {
    for (const name of ['skill-cli.js', 'skill-auth.js']) {
        assert.deepEqual(
            fs.readFileSync(path.join(resources, 'js/common/cli/linux', name)),
            fs.readFileSync(path.join(repo, 'res/scripts', name)),
        );
    }
});

test('final build includes Linux installer entry adapters', () => {
    const installer = path.join(resources, 'wechatide-skill/skills/installer/scripts');
    assert.deepEqual(fs.readFileSync(path.join(installer, 'linux-installation.mjs')),
        fs.readFileSync(path.join(repo, 'res/scripts/linux-installation.mjs')));
    for (const name of ['check-installation', 'ensure-cli-path']) {
        assert.deepEqual(fs.readFileSync(path.join(installer, `${name}.mjs`)),
            fs.readFileSync(path.join(repo, 'res/scripts/skill-installer.mjs')));
        assert.ok(fs.statSync(path.join(installer, `${name}.upstream.mjs`)).size > 0);
    }
});
