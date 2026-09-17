"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const vm = require("node:vm");
const { EventEmitter } = require("node:events");
const { test } = require("node:test");
const { patchWebviewTouchFocus } = require("../tools/fix-webview-touch-focus");

const patch = fs.readFileSync(path.join(__dirname, "../res/scripts/webview-touch-focus.js"), "utf8");
const mouseLeavePatch = fs.readFileSync(path.join(__dirname, "../res/scripts/webview-mouse-leave.js"), "utf8");
const moduleSource = `
// preload/electron/index.js
exports.WebviewInstance = class {
    getOriginElement() { return this.view; }
    setEmulationTouch(enabled, extra) {
        this.calls.push(["touch", enabled, extra]);
        return this.result;
    }
};
`;
const mainModuleSource = `
// Emulation.setEmitTouchEventsForMouse
exports.WebviewManagerServiceMain = class {
    tryGetWebContentById(id) { return this.views.get(id); }
    fireTouchModeChangeEvent(id, enabled) { this.notifications.push([id, enabled]); }
    setEmulationTouch(id, enabled, extra) {
        this.calls.push([id, enabled, extra]);
        return this.result;
    }
};
`;

function fixture(t) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "wechat-touch-patch-"));
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
    fs.mkdirSync(path.join(dir, "js"));
    const file = path.join(dir, "js", "version-dependent-name.js");
    fs.writeFileSync(file, moduleSource);
    const mainFile = path.join(dir, "js", "main-version-dependent-name.js");
    fs.writeFileSync(mainFile, mainModuleSource);
    return { dir, file, mainFile };
}

test("finds the Electron module, applies once, and replaces an older patch", t => {
    const { dir, file, mainFile } = fixture(t);
    fs.writeFileSync(path.join(dir, "js", "unrelated.js"), "exports.WebviewInstance = class {};");
    assert.deepEqual(patchWebviewTouchFocus(dir), [file, mainFile]);
    const applied = fs.readFileSync(file, "utf8");
    assert.ok(applied.endsWith(patch));
    assert.ok(fs.readFileSync(mainFile, "utf8").endsWith(mouseLeavePatch));
    patchWebviewTouchFocus(dir);
    assert.equal(fs.readFileSync(file, "utf8"), applied);
    fs.writeFileSync(file, applied.replace("if (process.platform", "// previous patch\n    if (process.platform"));
    patchWebviewTouchFocus(dir);
    assert.equal(fs.readFileSync(file, "utf8"), applied);
});

test("rejects missing or ambiguous modules without modifying candidates", t => {
    const { dir, file } = fixture(t);
    fs.writeFileSync(path.join(dir, "js", "second.js"), moduleSource);
    assert.throws(() => patchWebviewTouchFocus(dir), /found 2/);
    assert.equal(fs.readFileSync(file, "utf8"), moduleSource);
    fs.unlinkSync(file);
    fs.unlinkSync(path.join(dir, "js", "second.js"));
    assert.throws(() => patchWebviewTouchFocus(dir), /found 0/);
});

test("rejects an incomplete existing patch", t => {
    const { dir, file } = fixture(t);
    const damaged = moduleSource + "/* wechat-devtools linux webview touch focus begin */";
    fs.writeFileSync(file, damaged);
    assert.throws(() => patchWebviewTouchFocus(dir), /Invalid existing/);
    assert.equal(fs.readFileSync(file, "utf8"), damaged);
});

test("does not partly install when the main-process module is missing", t => {
    const { dir, file, mainFile } = fixture(t);
    fs.unlinkSync(mainFile);
    assert.throws(() => patchWebviewTouchFocus(dir), /WebviewManagerServiceMain.*found 0/);
    assert.equal(fs.readFileSync(file, "utf8"), moduleSource);
});

function runtime(platform = "linux") {
    const context = vm.createContext({ exports: {}, process: { platform } });
    vm.runInContext(moduleSource, context);
    vm.runInContext(patch, context);
    vm.runInContext(patch, context); // Loading the patch again must not wrap twice.
    const instance = new context.exports.WebviewInstance();
    instance.calls = [];
    instance.result = Promise.resolve("original result");
    const frame = { focus: options => instance.calls.push(["focus", options.preventScroll]) };
    instance.view = {
        tagName: "WEBVIEW",
        isConnected: true,
        hasAttribute: name => name === "route",
        getBoundingClientRect: () => ({ x: 100, y: 100, width: 390, height: 753 }),
        shadowRoot: { querySelector: () => frame },
        ownerDocument: { elementFromPoint: () => instance.view },
    };
    return instance;
}

test("focuses the embedded frame before enabling touch and preserves the original result", () => {
    const instance = runtime();
    assert.equal(instance.setEmulationTouch(true, "argument"), instance.result);
    assert.deepEqual(instance.calls.map(call => Array.from(call)), [["focus", true], ["touch", true, "argument"]]);
});

test("does not focus on disable, covered/detached views, non-page views, or non-Linux", () => {
    const cases = [
        ["disable", () => {}, false],
        ["covered", i => { i.view.ownerDocument.elementFromPoint = () => ({}); }, true],
        ["detached", i => { i.view.isConnected = false; }, true],
        ["appservice", i => { i.view.hasAttribute = () => false; }, true],
        ["no frame yet", i => { i.view.shadowRoot = null; }, true],
        ["non-Linux", () => {}, true, "win32"],
    ];
    for (const [name, prepare, enabled, platform] of cases) {
        const instance = runtime(platform);
        prepare(instance);
        assert.equal(instance.setEmulationTouch(enabled), instance.result, name);
        assert.deepEqual(instance.calls.map(call => Array.from(call)), [["touch", enabled, undefined]], name);
    }
});

function mainRuntime(platform = "linux") {
    const context = vm.createContext({
        exports: {}, process: { platform }, console,
        require: name => {
            assert.equal(name, "electron");
            return { BrowserWindow: { fromWebContents: host => ({ getContentBounds: () => host.bounds }) } };
        },
    });
    vm.runInContext(mainModuleSource, context);
    vm.runInContext(mouseLeavePatch, context);
    vm.runInContext(mouseLeavePatch, context);
    const service = new context.exports.WebviewManagerServiceMain();
    service.calls = [];
    service.notifications = [];
    service.views = new Map();
    service.result = Promise.resolve();
    const createView = (id, host, url = "http://localhost/__pageframe__/page") => {
        if (!host.on) {
            Object.setPrototypeOf(host, EventEmitter.prototype);
            EventEmitter.call(host);
        }
        host.bounds ??= { x: 100, y: 200 };
        host.getZoomFactor ??= () => 1;
        host.isDestroyed ??= () => false;
        host.domViews ??= [];
        host.focuses ??= [];
        const domView = {
            tagName: "WEBVIEW", isConnected: true,
            parentElement: { style: { zIndex: String(id) } },
            getWebContentsId: () => id,
            shadowRoot: { querySelector: () => ({ focus: () => host.focuses.push(["page", id]) }) },
        };
        host.domViews.push(domView);
        const phone = {
            querySelectorAll: () => host.domViews,
            getBoundingClientRect: () => ({ toJSON: () => ({ x: 0, y: 0, width: 390, height: 844 }) }),
            focus: () => host.focuses.push(["chrome"]),
        };
        host.executeJavaScript ??= async code => vm.runInNewContext(code, {
            document: {
                querySelector: () => phone,
                elementFromPoint: (x, y) => {
                    host.lastHitPoint = { x, y };
                    if (host.chrome) return { closest: () => phone };
                    if (host.hitTarget?.tagName === "WEBVIEW" && host.hitTarget.hasAttribute("route")) {
                        const top = host.domViews.at(-1);
                        top.closest = () => phone;
                        return top;
                    }
                    return { closest: () => null };
                },
            },
        });
        const view = new EventEmitter();
        view.id = id;
        view.hostWebContents = host;
        view.getURL = () => url;
        service.views.set(id, view);
        return view;
    };
    const calls = () => service.calls.map(call => Array.from(call));
    const mouse = async (view, type, button = "none", point = { globalX: 200, globalY: 400 }) => {
        view.emit("before-mouse-event", {}, { type, button, ...point });
        // Native EventEmitter callbacks do not await the coalesced hit test.
        await new Promise(resolve => setImmediate(resolve));
    };
    const leave = (view, button, point) => mouse(view, "mouseLeave", button, point);
    return { service, createView, calls, leave, mouse };
}

test("leaving the simulator disables the active tab's shared emulator only once", async () => {
    const { service, createView, calls, leave } = mainRuntime();
    const host = {};
    const oldView = createView(1, host);
    createView(2, host);
    service.setEmulationTouch(1, true);
    assert.equal(service.setEmulationTouch(2, true, "argument"), service.result);
    service.setEmulationTouch(1, false); // A late old-page update must not forget the active tab.
    assert.deepEqual(calls(), [[1, true, undefined], [2, true, "argument"]]);
    assert.deepEqual(service.notifications.map(call => Array.from(call)), [[1, false]]);
    service.calls.length = 0;
    await leave(oldView);
    await leave(oldView);
    assert.deepEqual(calls(), [[2, false, undefined]]);
    assert.equal(oldView.listenerCount("before-mouse-event"), 1);
});

test("leaving one project preserves another project's emulator and held drags", async () => {
    const { service, createView, calls, leave } = mainRuntime();
    const a = createView(1, {});
    const b = createView(2, {});
    service.setEmulationTouch(1, true);
    service.setEmulationTouch(2, true);
    service.calls.length = 0;
    await leave(a, "left");
    assert.deepEqual(calls(), []);
    await leave(a);
    assert.deepEqual(calls(), [[1, false, undefined]]);
    await leave(b);
    assert.deepEqual(calls(), [[1, false, undefined], [2, false, undefined]]);
});

test("destruction removes the native listener and obsolete active state", async () => {
    const { service, createView, calls, leave } = mainRuntime();
    const host = {};
    const a = createView(1, host);
    const b = createView(2, host);
    service.setEmulationTouch(1, true);
    service.setEmulationTouch(2, true);
    b.emit("destroyed");
    assert.equal(b.listenerCount("before-mouse-event"), 0);
    service.calls.length = 0;
    await leave(a);
    assert.deepEqual(calls(), []);
});

test("a leave caused by switching tabs keeps touch enabled inside the simulator", async () => {
    const { service, createView, calls, leave } = mainRuntime();
    const host = { hitTarget: { tagName: "WEBVIEW", hasAttribute: name => name === "route" } };
    const oldView = createView(1, host);
    createView(2, host);
    service.setEmulationTouch(1, true);
    service.setEmulationTouch(2, true);
    service.calls.length = 0;
    await leave(oldView);
    assert.deepEqual(calls(), []);
    host.hitTarget = { tagName: "DIV" };
    await leave(oldView);
    assert.deepEqual(calls(), [[2, false, undefined]]);
});

test("native coordinates account for host position and zoom; other webviews are outside", async () => {
    const { service, createView, calls, leave } = mainRuntime();
    const host = {
        bounds: { x: 400, y: 100 }, getZoomFactor: () => 2,
        hitTarget: { tagName: "WEBVIEW", hasAttribute: () => false },
    };
    const view = createView(1, host);
    service.setEmulationTouch(1, true);
    service.calls.length = 0;
    await leave(view, "none", { globalX: 1000, globalY: 500 });
    assert.deepEqual(host.lastHitPoint, { x: 300, y: 200 });
    assert.deepEqual(calls(), [[1, false, undefined]]);
});

test("an old asynchronous exit check cannot disable a newly enabled tab", async () => {
    const { service, createView, calls, leave } = mainRuntime();
    let resolveHit;
    const host = { executeJavaScript: () => new Promise(resolve => { resolveHit = resolve; }) };
    const oldView = createView(1, host);
    createView(2, host);
    service.setEmulationTouch(1, true);
    const pending = leave(oldView);
    service.setEmulationTouch(2, true);
    service.calls.length = 0;
    resolveHit({ zone: "outside" });
    await pending;
    assert.deepEqual(calls(), []);
});

test("native exit handling skips unrelated views and non-Linux runtimes", () => {
    for (const [platform, url] of [["linux", "devtools://devtools/bundled/devtools_app.html"], ["win32", "http://localhost/__pageframe__/page"]]) {
        const { service, createView } = mainRuntime(platform);
        const view = createView(1, {}, url);
        service.setEmulationTouch(1, true);
        assert.equal(view.listenerCount("before-mouse-event"), 0);
    }
});

test("entering the title directly enables touch and focuses the phone chrome", async () => {
    const { service, createView, calls, mouse } = mainRuntime();
    const host = { chrome: true };
    createView(1, host);
    service.setEmulationTouch(1, false);
    service.calls.length = 0;
    await mouse(host, "mouseMove");
    assert.deepEqual(calls(), [[1, true, undefined]]);
    assert.deepEqual(host.focuses, [["chrome"]]);
    service.setEmulationTouch(1, false); // The guest's DOM leave only entered its title.
    assert.deepEqual(calls(), [[1, true, undefined]]);
    assert.deepEqual(service.notifications.map(call => Array.from(call)), [[1, true]]);
});

test("leaving the title for host controls restores mouse mode without a guest leave", async () => {
    const { service, createView, calls, mouse } = mainRuntime();
    const host = { chrome: true };
    createView(1, host);
    service.setEmulationTouch(1, false);
    await mouse(host, "mouseMove");
    service.calls.length = 0;
    host.chrome = false;
    await mouse(host, "mouseMove", "none", { globalX: 900, globalY: 600 });
    assert.deepEqual(calls(), [[1, false, undefined]]);
});

test("moving between title and page transfers focus while retaining the same touch mode", async () => {
    const { service, createView, calls, mouse } = mainRuntime();
    const host = { chrome: true };
    const view = createView(1, host);
    service.setEmulationTouch(1, false);
    service.calls.length = 0;
    await mouse(host, "mouseMove");
    host.chrome = false;
    host.hitTarget = { tagName: "WEBVIEW", hasAttribute: () => true };
    await mouse(view, "mouseMove");
    assert.deepEqual(host.focuses, [["chrome"], ["page", 1]]);
    assert.deepEqual(calls(), [[1, true, undefined]]);
});

test("mouse movement within unchanged phone chrome reuses the region cache", async () => {
    const { service, createView, mouse } = mainRuntime();
    const host = { chrome: true };
    createView(1, host);
    const execute = host.executeJavaScript;
    let queries = 0;
    host.executeJavaScript = code => { queries++; return execute(code); };
    service.setEmulationTouch(1, false);
    await mouse(host, "mouseMove");
    const initialQueries = queries;
    await mouse(host, "mouseMove", "none", { globalX: 210, globalY: 410 });
    assert.equal(queries, initialQueries);
});
