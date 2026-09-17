#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

function patchWebviewTouchFocus(packageDir) {
    const jsDir = path.join(packageDir, "js");
    const modules = fs.readdirSync(jsDir, { withFileTypes: true })
        .filter(entry => entry.isFile() && entry.name.endsWith(".js"))
        .map(entry => {
            const file = path.join(jsDir, entry.name);
            return { file, source: fs.readFileSync(file, "utf8") };
        });
    const patches = [
        {
            name: "WebviewInstance",
            script: "webview-touch-focus.js",
            marker: "webview touch focus",
            matches: source => /\bexports\.WebviewInstance\s*=/.test(source) &&
                /setEmulationTouch\s*\(/.test(source) && source.includes("preload/electron/index.js"),
        },
        {
            name: "WebviewManagerServiceMain",
            script: "webview-mouse-leave.js",
            marker: "webview mouse leave",
            matches: source => /\bexports\.WebviewManagerServiceMain\s*=/.test(source) &&
                source.includes("Emulation.setEmitTouchEventsForMouse"),
        },
    ];

    // Validate both version-dependent modules before changing either one.
    const changes = patches.map(({ name, script, marker, matches }) => {
        const candidates = modules.filter(({ source }) => matches(source));
        if (candidates.length !== 1) {
            throw new Error(`Expected one Electron ${name} module, found ${candidates.length}`);
        }
        const { file, source } = candidates[0];
        const begin = `/* wechat-devtools linux ${marker} begin */`;
        const end = `/* wechat-devtools linux ${marker} end */`;
        const start = source.indexOf(begin);
        let original = source;
        if (start !== -1) {
            const finish = source.indexOf(end, start);
            if (finish === -1 || source.slice(finish + end.length).trim() ||
                source.indexOf(begin, start + begin.length) !== -1) {
                throw new Error(`Invalid existing touch focus patch in ${file}`);
            }
            original = source.slice(0, start);
        }

        const patch = fs.readFileSync(path.join(__dirname, "../res/scripts", script), "utf8");
        return { file, source, result: `${original.trimEnd()}\n${patch}` };
    });
    for (const { file, source, result } of changes) {
        if (result !== source) fs.writeFileSync(file, result);
    }
    return changes.map(({ file }) => file);
}

if (require.main === module) {
    const packageDir = path.resolve(process.argv[2] || path.join(__dirname, "../resources/app"));
    console.info(`Patched WebView touch focus: ${patchWebviewTouchFocus(packageDir).join(", ")}`);
}

module.exports = { patchWebviewTouchFocus };
