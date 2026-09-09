#!/usr/bin/env node
// Patch the platform boundaries of the bundled upstream skill CLI.
const fs = require('node:fs');
const path = require('node:path');

const packageDir = process.argv[2] || path.resolve(__dirname, '../resources/app.asar.unpacked');
const installer = 'wechatide-skill/skills/installer/scripts/';

function replaceOnce(source, before, after, label) {
    if (source.includes(after)) return source;
    if (source.split(before).length !== 2) {
        throw new Error(`Unsupported upstream ${label}; expected exactly one patch location`);
    }
    return source.replace(before, () => after);
}

const windowsUserDir = 'o.join(process.env.USERPROFILE||"~",`AppData/Local/${global.userDirName}/User Data/${global.productHash}`)';
const windowsAuth = 'else{if("win32"!==process.platform)return Promise.reject(new Error("unsupported platform: "+process.platform));';
const patches = [
    ['js/common/cli/skill-index.js', [
        [windowsUserDir,
            `("linux"===process.platform?o.join(process.env.XDG_CONFIG_HOME||o.join(process.env.HOME||"~",".config"),global.userDirName,global.productHash):${windowsUserDir})`,
            'skill CLI data directory'],
        [windowsAuth,
            'else if("linux"===process.platform){n=u.join(process.env.WECHAT_DEVTOOLS_DIR||u.dirname(process.execPath),"electron"),o=[global.installPath,e,"--cli"]}' + windowsAuth,
            'skill CLI auth launcher'],
    ]],
    [installer + 'install-root.mjs', [
        ['  const value = String(platform).toLowerCase()\n',
            "  const value = String(platform).toLowerCase()\n  if (value === 'linux') {\n    return 'linux'\n  }\n",
            'installer platform'],
        ['export function getInstallRoots(platform, installRoot) {\n  if (installRoot) {\n    return [installRoot]\n  }\n',
            "export function getInstallRoots(platform, installRoot) {\n  if (installRoot) {\n    return [installRoot]\n  }\n\n  if (platform === 'linux') {\n    const command = resolveWechatideFromPath()\n    return command ? [path.resolve(path.dirname(fs.realpathSync(command)), '..')] : []\n  }\n",
            'installer directory discovery'],
        ['export function getWechatidePath(platform, installRoot) {\n  if (!installRoot) {\n    return null\n  }\n',
            "export function getWechatidePath(platform, installRoot) {\n  if (!installRoot) {\n    return null\n  }\n  if (platform === 'linux') {\n    return path.join(installRoot, 'bin', 'wechatide')\n  }\n",
            'installer CLI path'],
    ]],
    [installer + 'ensure-cli-path.mjs', [
        ["  const payload = options.platform === 'darwin'\n",
            "  const payload = ['darwin', 'linux'].includes(options.platform)\n",
            'installer Unix PATH setup'],
    ]],
];

try {
    // Validate every upstream location before changing any file.
    const changes = patches.map(([relative, replacements]) => {
        const file = path.join(packageDir, relative);
        const original = fs.readFileSync(file, 'utf8');
        const updated = replacements.reduce((source, patch) => replaceOnce(source, ...patch), original);
        return { file, original, updated };
    });
    for (const { file, original, updated } of changes) {
        if (original === updated) continue;
        const temporary = `${file}.linux-${process.pid}.tmp`;
        try {
            fs.writeFileSync(temporary, updated, { flag: 'wx', mode: fs.statSync(file).mode });
            fs.renameSync(temporary, file);
        } finally {
            if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
        }
    }
    console.log('wechatide Linux support is ready');
} catch (error) {
    console.error(error.message);
    process.exitCode = 1;
}
