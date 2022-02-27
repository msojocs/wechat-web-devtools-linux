#! /bin/bash
# Author: https://github.com/cytle/wechat_web_devtools/issues/293#issuecomment-604623774

set -e

root_dir=$(cd `dirname $0`/.. && pwd -P)
NW_PACKAGE_DIR="$root_dir/package.nw"

cd "$NW_PACKAGE_DIR"
target_file=js/unpack/hackrequire/index.js

if [ ! -f "$target_file" ]; then
    echo -e "\e[1;31m$target_file is not exist\e[0m" >&2
    exit 1
fi
# 判断匹配函数，匹配函数不为0，则包含给定字符
if [ `grep -c "patch wechat devtools begin" $target_file` -ne '0' ];then
    echo -e "\e[1;31m$target_file seems to have been modified\e[0m" >&2
    exit 1
fi

tmp_file=$(mktemp)
cat > "$tmp_file" <<EOF
/* patch wechat devtools begin */
/* nw-menu.js */
(() => {
    try {
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
    } catch (error) {
        process.stderr.write(error.message);
        process.stderr.write(error.stack);
    }
})();
/* patch wechat devtools end */
EOF
cat "$target_file" >> "$tmp_file"

cat "$tmp_file" > "$target_file"
rm "$tmp_file"
