/* patch wechat devtools begin */
(() => {
    try {
        {
            // 修正编译器路径
            const originalSpawn = require("child_process").spawn;
            require("child_process").spawn = function (command, args, options) {
                if (command.includes("wcc.exe")) {
                    command = command.replace("code/package.nw", "package.nw");
                    command = command.replace("wcc.exe", "wcc");
                } else if (command.includes("wcsc.exe")) {
                    command = command.replace("code/package.nw", "package.nw");
                    command = command.replace("wcsc.exe", "wcsc");
                }
                return originalSpawn.apply(this, [command, args, options]);
            };
        }
        {
            // 修正路径错误
            const originalResolve = require("path").resolve;
            require("path").resolve = function (...paths) {
                if (paths.length === 2 && paths[1].includes("code/package.nw")) {
                    paths[1] = paths[1].replace("code/package.nw", "package.nw");
                }
                return originalResolve.apply(this, paths);
            };
        }
        if (typeof nw === "undefined") {
            return;
        }
        
        let log = function (content) {
            process.stderr.write(content + "\n");
        };
        
        let originMenuItem = nw.MenuItem;
        nw.MenuItem = function MenuItem(options) {
        
            options = Object.assign({}, options);
        
            delete options.shortcutName;
            delete options.shouldEnabled;
        
            if (options.label && (typeof options.label === "string")) {
        
                if (options.label.indexOf("[") !== -1) {
                    let rest = options.label.split("[").slice(1).join("[").trim();
                    if (rest[rest.length - 1] === "]") {
                        rest = rest.slice(0, -1).split("+").map((x) => {
                            if (!x) { return "+" }
                            switch (x) {
                                case "↓": { return "Down"; }
                                case "↑": { return "Up"; }
                                case "PAGE↓": { return "PageDown"; }
                                case "PAGE↑": { return "PageUp"; }
                                case "←": { return "Left"; }
                                case "→": { return "Right"; } 
                                default: { return x; }
                            }
                        });
                        if (rest.length > 1) {
                            options.key = rest[rest.length - 1];
                            options.modifiers = rest.slice(0, -1).join("+");
                        } else {
                            options.key = rest[0];
                        }
                    }
                    options.label = options.label.split("[")[0];
                }
        
                if (options.label.indexOf("(&") !== -1) {
                    options.label = options.label.split("(&")[0];
                }
                options.label = options.label.replace("&", "").trim();
        
                switch (options.label) {
                    case "Go to Declaration": { options.label = "转到声明"; break; }
                    case "Go to References": { options.label = "转到引用"; break; }
                    case "Find All References": { options.label = "查找所有引用"; break; }
                    case "Find All Implementations": { options.label = "查找所有实现"; break; }
                }
        
            }
        
            return new originMenuItem(options);
        
        };
        
        let originAppend = nw.Menu.prototype.append;
        nw.Menu.prototype.append = function (item) {
        
            if (item.parentMenu) {
                item.parentMenu.remove(item);
            }
            item.parentMenu = this;
            
            if ((this.items.length > 0) && 
                (this.items[this.items.length - 1].type === "separator") &&
                (item.type === "separator")) {
                originInsert.call(this, item, this.items.length);
                return;
            }
        
            if ((this.items.length === 0) && (item.type === "separator")) {
                originInsert.call(this, item, this.items.length);
                return;
            }
        
            return originAppend.call(this, item);
        };
        
        let originInsert = nw.Menu.prototype.insert;
        nw.Menu.prototype.insert = function (item, index) {
            if (item.parentMenu) {
                item.parentMenu.remove(item);
            }
            item.parentMenu = this;
            return originInsert.call(this, item, index);
        };
        {
            // 修正新窗口数据丢失的问题
            const originalOpen = nw.Window.open
            nw.Window.open = function (url, options, callback) {
                console.warn('[wechat-devtools] nw.Window.open is called, url:', url, 'options:', options);
                let cb = callback
                if (options.title === '版本更新提示') {
                    options.inject_js_start = 'js/unpack/hackrequire/index.js';
                    cb = (...args) => {
                        const keys = [
                            "shareData",
                            "windowMap",
                            "isSimple",
                            "masterProxyPort",
                            "proxyPort",
                            "masterH2ProxyPort",
                            "h2ProxyPort"
                        ];
                        for(let k of keys)
                            args[0].window.global[k] = global[k];
                        callback(...args)
                    }
                }
                else if (options.title === '云开发控制台') {
                    cb = (...args) => {
                        const keys = [
                            "shareData",
                            "windowMap",
                            "isSimple",
                            "masterProxyPort",
                            "proxyPort",
                            "masterH2ProxyPort",
                            "h2ProxyPort",
                            'tokenData',
                        ];
                        for(let k of keys)
                            args[0].window.global[k] = global[k];
                        callback(...args)
                    }
                }
                else if (options.title.includes('微信开发者工具')) {
                    cb = (...args) => {
                        const keys = [
                            "shareData",
                            "windowMap",
                            "isSimple",
                            "masterProxyPort",
                            "proxyPort",
                            "masterH2ProxyPort",
                            "h2ProxyPort",
                            'tokenData',
                        ];
                        for(let k of keys)
                            args[0].window.global[k] = global[k];
                        callback(...args)
                    }
                }
                return originalOpen.apply(this, [url, options, cb])
            }
        }
        {
            // 修正打开外部Terminal的功能
            const originalExec = require('child_process').exec;
            require('child_process').exec = function (command, options, callback) {
                if (command.includes('open -a Terminal')) {
                    command = 'gnome-terminal'
                }
                return originalExec.apply(this, [command, options, callback])
            }
        }
        {
            // 修正 暗色/亮色 自动跟随系统
            const {spawn, execSync} = require('child_process')
            let isDark = (function () {
                    try {
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
                                    `gsettings get org.gnome.desktop.interface ${this.gnomeScheme}`
                                );
                                break;
            
                            case "plasma":
                                theme = execSync(
                                    `gsettings get org.gnome.desktop.interface color-scheme`,
                                );
                                break;
                            default:
                                console.warn(
                                    `NOT SUPPORTED !!! DESKTOP_SESSION: ${DESKTOP_SESSION}`
                                );
                                break;
                        }
                        console.log(theme.toString());
                        return theme.toString().toLowerCase().includes("dark");
                    } catch (error) {
                        console.error("尝试获取主题信息失败，使用默认暗色");
                        return true;
                    }
                })()
            const originalMatchMedia = window.matchMedia
            window.matchMedia = function (...args) {
                console.warn('----------------> matchMedia:', ...args)
                const mm = originalMatchMedia.apply(this, args)
                Object.defineProperty(mm, 'matches', {
                    get(){
                        return isDark
                    }
                })
                return mm
            }
            class CheckDark {
                // 监听gsettings monitor org.gnome.desktop.interface gtk-theme
                monitorTheme(callback) {
                    try {
                        if (this.callback) {
                            this.callback = callback
                            return;
                        }
                        this.callback = callback
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
                                    this.gnomeScheme,
                                ]);
                                break;
                            case "plasma":
                                monitor = spawn("gsettings", [
                                    "monitor",
                                    "org.gnome.desktop.interface",
                                    'color-scheme',
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
                            monitor.stdout.on("data", (chunk) => {
                                const data = chunk.toString();
                                console.warn('Theme changed:', data)
                                isDark = data.toLowerCase().includes("dark");
                                this.callback(isDark)
                            });
                        process.on("SIGTERM", (signal) => {
                            monitor.kill(signal);
                        });
                    } catch (err) {
                        console.error("尝试监听主题失败！", err);
                    }
                }
                get gnomeScheme() {
                    try {
                        // 判断 Gnome-Shell 版本 from @icepie
                        const gnomeVersion = execSync(`gnome-shell --version`)
                            .toString()
                            .replace(/[\r\n]/g, "")
                            .split(" ");
                        const gnomeVersionNum =
                            gnomeVersion.length == 3 ? Number(gnomeVersion[2]) : 0;
                        return gnomeVersionNum >= 42 ? "color-scheme" : "gtk-theme";
                    } catch (err) {
                        console.error("检查gnome版本失败, 使用gtk-theme", err);
                        return "gtk-theme";
                    }
                }
            }
            const checkDark = new CheckDark()
            const original = MediaQueryList.prototype.addEventListener
            MediaQueryList.prototype.addEventListener = function (...args) {
                console.warn('----------> MediaQueryList.addEventListener:', ...args)
                checkDark.monitorTheme((isDark) => {
                    args[1]({
                        matches: isDark
                    })
                })
                return original.apply(this, args)
            }
        }
        {
            // 修复云开发控制台
            const originalBind = Function.prototype.bind
            Function.prototype.bind = function(...args) {
                if (args[0]?._tokenMap) {
                    console.warn('---------set tokenData')
                    if (window.tokenData) {
                        args[0]._sessionToken = window.tokenData._sessionToken
                        args[0]._tokenMap = window.tokenData._tokenMap
                    }
                    else
                        window.tokenData = args[0]
                }
                return originalBind.apply(this, args)
            }
        }
    } catch (error) {
        process.stderr.write(error.message);
        process.stderr.write(error.stack);
    }
})();
/* patch wechat devtools end */