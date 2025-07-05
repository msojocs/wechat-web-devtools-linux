/* patch wechat devtools begin */
(() => {
    try {
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
        const originalResolve = require("path").resolve;
        require("path").resolve = function (...paths) {
            if (paths.length === 2 && paths[1].includes("code/package.nw")) {
                paths[1] = paths[1].replace("code/package.nw", "package.nw");
            }
            return originalResolve.apply(this, paths);
        };
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
        const originalExec = require('child_process').exec;
        require('child_process').exec = function (command, options, callback) {
            if (command.includes('open -a Terminal')) {
                command = 'gnome-terminal'
            }
            return originalExec.apply(this, [command, options, callback])
        }
    } catch (error) {
        process.stderr.write(error.message);
        process.stderr.write(error.stack);
    }
})();
/* patch wechat devtools end */