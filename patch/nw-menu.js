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

    if (options.label) {

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
