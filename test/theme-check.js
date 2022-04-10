#!/usr/bin/env node
const { execSync, spawn } = require("child_process");

class CheckDark {
    // 监听gsettings monitor org.gnome.desktop.interface gtk-theme
    monitorTheme() {
        let monitor = null;
        const { DESKTOP_SESSION } = process.env;
        switch (DESKTOP_SESSION) {
            case "deepin":
                monitor = spawn("gsettings", [
                    "monitor",
                    "com.deepin.dde.appearance",
                    "gtk-theme",
                ]);
                break;
            case "gnome":
            case "gnome-classic":
                const gnomeVersion = execSync(`gnome-shell --version`).toString().replace(/[\r\n]/g, "").split(" ")
                const gnomeVersionNum = gnomeVersion.length ? Number(gnomeVersion[2]) : 0
                if (gnomeVersionNum >= 42) {
                    monitor = spawn("gsettings", [
                        "monitor",
                        "org.gnome.desktop.interface",
                        "color-scheme",
                    ]);
                } else {
                    monitor = spawn("gsettings", [
                        "monitor",
                        "org.gnome.desktop.interface",
                        "gtk-theme",
                    ]);
                }
                break;
            default:
                console.warn(
                    `NOT SUPPORTED !!! DESKTOP_SESSION: ${DESKTOP_SESSION}`
                );
                break;
        }
        monitor &&
            monitor.on("error", (err) => {
                console.error("monitorTheme", err);
            });
        monitor &&
            monitor.stdout.on("data", (chunk) => {
                // TODO: 防抖动包装
                const data = chunk.toString();
                const t = data.includes("dark") || data.includes("Dark");
                console.log(data);
                console.log("dark", t);
                // (this._theme = t ? i.Dark : i.Light),
                //         this._onDidThemeChange.fire(this._theme);
            });
    }
    get isDark() {
        const { DESKTOP_SESSION } = process.env;
        console.log(DESKTOP_SESSION);
        let theme = "";
        switch (DESKTOP_SESSION) {
            case "deepin":
                theme = execSync(
                    `gsettings get com.deepin.dde.appearance gtk-theme`
                );
                break;
            case "gnome":
            case "gnome-classic":
                // 判断 Gnome-Shell 版本
                const gnomeVersion = execSync(`gnome-shell --version`).toString().replace(/[\r\n]/g, "").split(" ")
                const gnomeVersionNum = gnomeVersion.length ? Number(gnomeVersion[2]) : 0
                if (gnomeVersionNum >= 42) {
                    theme = execSync(
                        `gsettings get org.gnome.desktop.interface color-scheme`
                    );
                } else {
                    theme = execSync(
                        `gsettings get org.gnome.desktop.interface gtk-theme`
                    );
                }
                break;

            default:
                break;
        }
        return theme.includes("dark") || theme.includes("Dark");
    }
}
const cd = new CheckDark();
cd.monitorTheme();
console.log(cd.isDark);

function original() {
    !(function (require, directRequire) {
        "use strict";
        const { execSync, spawn } = require("child_process");
        Object.defineProperty(exports, "__esModule", { value: !0 }),
            (exports.OSThemeController = exports.OSTheme = void 0);
        const e = require("lodash"),
            t = require("./e45a1736f0cff12ccd223e3f4dd75808.js");
        var i;
        !(function (e) {
            (e[(e.Dark = 0)] = "Dark"),
                (e[(e.Light = 1)] = "Light"),
                (e[(e.Unknown = 2)] = "Unknown");
        })((i = exports.OSTheme || (exports.OSTheme = {})));
        const r = process.versions.nw || "0.0.0";
        exports.OSThemeController = class {
            constructor() {
                (this._onDidThemeChange = new t.EasyEmitter()),
                    // debounce, 防抖动， 该函数会从上一次被调用后，延迟 400 毫秒后调用 func 方法
                    (this.onMediaQueryChange = e.debounce((e) => {
                        console.warn("onMediaQueryChange", e);
                        const t = e.matches;
                        (this._theme = t ? i.Dark : i.Light),
                            this._onDidThemeChange.fire(this._theme);
                    }, 400)),
                    (this._theme = void 0),
                    (this._isEnabled = void 0),
                    (this._mediaQuery2 = void 0),
                    this.monitorTheme();
            }
            static get shared() {
                return (
                    this._shared || (this._shared = new this()), this._shared
                );
            }
            get onDidThemeChange() {
                return this._onDidThemeChange.event;
            }
            monitorTheme() {
                let monitor = null;
                const { DESKTOP_SESSION } = process.env;
                switch (DESKTOP_SESSION) {
                    case "deepin":
                        monitor = spawn("gsettings", [
                            "monitor",
                            "com.deepin.dde.appearance",
                            "gtk-theme",
                        ]);
                        break;
                    case "gnome":
                    case "gnome-classic":
                        monitor = spawn("gsettings", [
                            "monitor",
                            "org.gnome.desktop.interface",
                            "gtk-theme",
                        ]);
                        break;

                    default:
                        console.warn(
                            `NOT SUPPORTED !!! DESKTOP_SESSION: ${DESKTOP_SESSION}`
                        );
                        break;
                }
                monitor &&
                    monitor.on("error", (err) => {
                        console.error("monitorTheme", err);
                    });
                monitor &&
                    monitor.stdout.on("data", e.debounce((chunk) => {
                        // 防抖动包装 防抖动， 该函数会从上一次被调用后，延迟 400 毫秒后调用 本方法
                        const data = chunk.toString();
                        const t = data.includes("dark");
                        console.warn(data);
                        console.warn("dark", t);
                        (this._theme = t ? i.Dark : i.Light),
                            this._onDidThemeChange.fire(this._theme);
                    }, 400));
            }
            registerListeners() {
                var e, t;
                this.isEnabled() &&
                    (null === (e = this.mediaQuery) ||
                        void 0 === e ||
                        e.addEventListener("change", this.onMediaQueryChange),
                        null === (t = this.mediaQuery2) ||
                        void 0 === t ||
                        t.addEventListener("change", this.onMediaQueryChange));
            }
            getCurrentTheme() {
                console.warn("getCurrentTheme");
                return (
                    this._theme || (this._theme = this.tryGetCurrentTheme()),
                    this._theme
                );
            }
            isEnabled() {
                var e;
                if (void 0 === this._isEnabled) {
                    const i = t.compareVersion("0.44.6", r) <= 0,
                        n =
                            "not all" !==
                            (null ===
                                (e = window.matchMedia(
                                    "(prefers-color-scheme)"
                                )) || void 0 === e
                                ? void 0
                                : e.media);
                    this._isEnabled = i && n;
                }
                return this._isEnabled;
            }
            tryGetCurrentTheme() {
                if (this.isEnabled()) {
                    return this.isDark ? i.Dark : i.Light;
                    // return this.mediaQuery.matches ? i.Dark : i.Light;
                }
                return i.Unknown;
            }
            get mediaQuery() {
                return (
                    this._mediaQuery ||
                    (this._mediaQuery = window.matchMedia(
                        "(prefers-color-scheme: dark)"
                    )),
                    this._mediaQuery
                );
            }
            get mediaQuery2() {
                return (
                    void 0 === this._mediaQuery2 &&
                    (global.contentWindow && global.contentWindow !== window
                        ? (this._mediaQuery2 =
                            global.contentWindow.matchMedia(
                                "(prefers-color-scheme: dark)"
                            ))
                        : (this._mediaQuery2 = null)),
                    this._mediaQuery2
                );
            }
            get isDark() {
                const { DESKTOP_SESSION } = process.env;
                console.log(DESKTOP_SESSION);
                let theme = "";
                switch (DESKTOP_SESSION) {
                    case "deepin":
                        theme = execSync(
                            `gsettings get com.deepin.dde.appearance gtk-theme`
                        );
                        break;
                    case "gnome":
                    case "gnome-classic":
                        theme = execSync(
                            `gsettings get org.gnome.desktop.interface gtk-theme`
                        );
                        break;

                    default:
                        break;
                }
                return theme.includes("dark");
            }
            getDefaultTheme() {
                return i.Dark;
            }
        };
    })(require("licia/lazyImport")(require), require);
}
