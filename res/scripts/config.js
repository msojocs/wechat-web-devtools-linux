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
    } catch (error) {
        process.stderr.write(error.message);
        process.stderr.write(error.stack);
    }
})();
/* patch wechat devtools end */