#!/usr/bin/env node
// Install Linux entry adapters without editing upstream JavaScript text.
const fs = require('node:fs');
const path = require('node:path');
const packageDir = process.argv[2] || path.resolve(__dirname, '../resources/app.asar.unpacked');
const installerDir = path.join(packageDir, 'wechatide-skill/skills/installer/scripts');
const scriptsDir = path.resolve(__dirname, '../res/scripts');
const entries = ['check-installation', 'ensure-cli-path'];

try {
    // Check every input before installing or preserving files.
    for (const name of entries) fs.accessSync(path.join(installerDir, `${name}.mjs`));
    for (const name of ['skill-installer.mjs', 'linux-installation.mjs', 'skill-cli.js', 'skill-auth.js']) {
        fs.accessSync(path.join(scriptsDir, name));
    }
    fs.copyFileSync(path.join(scriptsDir, 'linux-installation.mjs'), path.join(installerDir, 'linux-installation.mjs'));
    for (const name of entries) {
        const entry = path.join(installerDir, `${name}.mjs`);
        const original = path.join(installerDir, `${name}.upstream.mjs`);
        // A fresh build supplies fresh upstream files; repeated runs retain the originals.
        if (!fs.existsSync(original)) fs.copyFileSync(entry, original, fs.constants.COPYFILE_EXCL);
        fs.copyFileSync(path.join(scriptsDir, 'skill-installer.mjs'), entry);
    }
    const adapterDir = path.join(packageDir, 'js/common/cli/linux');
    fs.mkdirSync(adapterDir, { recursive: true });
    for (const name of ['skill-cli.js', 'skill-auth.js']) {
        fs.copyFileSync(path.join(scriptsDir, name), path.join(adapterDir, name));
    }
    console.log('wechatide Linux support is ready');
} catch (error) {
    console.error(error.message);
    process.exitCode = 1;
}
