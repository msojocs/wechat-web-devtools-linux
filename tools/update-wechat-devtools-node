#!/usr/bin/env node

const { execSync, spawn } = require("child_process");
const https = require("https");
const fs = require("fs");
const path = require("path");
const { info } = require("console");
const util = require("util");
const { exit } = require("process");

const urls = {
    stable: "https://developers.weixin.qq.com/miniprogram/dev/devtools/stable.html",
    rc: "https://developers.weixin.qq.com/miniprogram/dev/devtools/rc.html",
    nightly:
        "https://developers.weixin.qq.com/miniprogram/dev/devtools/nightly.html",
};

const arguments = process.argv.slice(2);
console.log(arguments)

const args = {};
for (let arg of arguments) {
    let t = arg.split("=");
    args[t[0]] = t[1];
}
let branch = args.branch;
if (!branch || !urls[branch]) {
    branch = "stable";
}

const url = urls[branch];
// "https://servicewechat.com/wxa-dev-logic/download_redirect?type=x64&from=mpwiki";
// const url = "https://servicewechat.com/wxa-dev-logic/download_redirect?type=x64&from=mpwiki&version_type=1";
// https://servicewechat.com/wxa-dev-logic/download_redirect?type=x64&from=mpwiki&download_version=1022001191&version_type=1
// https://servicewechat.com/wxa-dev-logic/download_redirect?type=x64&from=mpwiki&download_version=1021911180&version_type=1
// https://dldir1.qq.com/WechatWebDev/nightly/p-7aa88fbb60d64e4a96fac38999591e31/wechat_devtools_1.02.2001202_x64.exe

let version = args.version;
let md5;

const packageDir = "code/package.nw";

const fetching = function () {
    return new Promise((resolve, reject) => {
        try {
            fs.mkdirSync(path(__dirname, "../cache"));
        } catch (error) {}

        if (version && version !== "latest") {
            if (!/\d+\.\d+\.\d+/.test(version)) reject("版本格式有误！");
            else {
                resolve(
                    `https://servicewechat.com/wxa-dev-logic/download_redirect?type=x64&from=mpwiki&download_version=${version.replace(/\./g, '')}&version_type=1`
                );
            }
        } else {
            info(`Fetching wechat-dev-tool info: ${url}`);
            https
                .get(url, (res) => {
                    let result = "";
                    res.on("data", (data) => {
                        result += data;
                    });
                    res.on("end", () => {
                        const linkM = result.match(/href="(https[^"]*?type=win32_x64.*?)"/)
                        if (!linkM) {
                            console.error("No windows-64 dist found");
                            exit(1);
                        }
                        const link = linkM[1]
                        resolve(link);
                    });
                })
                .on("error", reject);
        }
    });
};

const download = function (url) {
    return new Promise((resolve, reject) => {
        info(`Downloading ${url}`);

        version = url.match(/version=(\d+)&/)[1];
        let mainVer = version.substring(0, version.length - 9);
        let subVer = version.substring(version.length - 9, version.length - 7);
        let time = version.substring(version.length - 7);
        version = [mainVer, subVer, time].join(".");

        let localPath = path.resolve(
            __dirname,
            util.format("../cache/wechat_devtools_%s_x64.exe", version)
        );
        let headers = execSync(`curl -IL "${url}"`).toString()
        console.log('response header data:', headers)
        md5 = headers.match(/X-COS-META-MD5: (.*?)\r/i)[1]

        if (fs.existsSync(localPath)) {
            resolve(localPath);
            return;
        }

        // wget -c url -O out
        const ls = spawn("wget", ["-c", url, "-O", `${localPath}.tmp`], {
            stdio: "inherit",
        });

        ls.on("close", (code) => {
            console.info(`Download Wechat DevTools Result Code: ${code}`);
            if (code === 0) {
                fs.renameSync(`${localPath}.tmp`, localPath);
                resolve(localPath);
            } else {
                reject();
            }
        });
    });
};

const extract = function (localPath) {
    // 解压
    info(`Extracting ${localPath}`);
    return new Promise((resolve, reject) => {
        let extractPath = path.resolve(
            __dirname,
            `../tmp/${path.basename(localPath)}`
        );

        execSync(`rm -rf ${extractPath}`);

        try {
            fs.mkdirSync(extractPath);
        } catch (error) {}

        const ext = spawn(
            "7z",
            ["x", localPath, `-o${extractPath}`, packageDir],
            {
                stdio: "inherit",
            }
        );
        ext.on("error", (code) => {
            reject(code);
        });
        ext.on("close", (code) => {
            info(`解压完毕：${code}`);
            resolve(extractPath);
        });
    });
};

const upgrade = function (extractPath) {
    info(`Upgrading ${path.basename(extractPath)}`);

    return new Promise((resolve, reject) => {
        // 删除原文件
        execSync(`rm -rf ${path.resolve(__dirname, "../package.nw")}`);

        // 替换
        fs.renameSync(
            path.resolve(extractPath, packageDir),
            path.resolve(__dirname, "../package.nw")
        );

        // 尝试修改权限
        try {
            execSync(
                `chmod -R 755 ${path.resolve(__dirname, "../package.nw")}`
            );
        } catch (err) {
            // ignore
            console.error(err);
        }

        // 删除临时
        execSync(`rm -rf ${extractPath}`);

        if (fs.existsSync(path.resolve(__dirname, "../nwjs"))) {
            if (
                !fs.statSync(__dirname, "../nwjs/package.nw").isSymbolicLink()
            ) {
                execSync(
                    `rm -rf ${path.resolve(__dirname, "../nwjs/package.nw")}`
                );
                console.log(
                    `创建链接 ${path.resolve(
                        __dirname,
                        "../package.nw"
                    )}--->${path.resolve(__dirname, "../nwjs/package.nw")}`
                );
                // 链接
                execSync(
                    `cd ${path.resolve(
                        __dirname,
                        "../nwjs"
                    )} && ln -s ../package.nw package.nw`
                );
            }
        }
        if(fs.existsSync(path.resolve(__dirname, '../package.nw/js/common/miniprogram-builder/modules/fullcompiler/app/contactandlaunch/updateContactAndLaunch.js'))) {
            try {
                fs.renameSync(
                    path.resolve(__dirname, '../package.nw/js/common/miniprogram-builder/modules/fullcompiler/app/contactandlaunch/updateContactAndLaunch.js'),
                    path.resolve(__dirname, '../package.nw/js/common/miniprogram-builder/modules/fullcompiler/app/contactandlaunch/updatecontactandlaunch.js')
                )
            } catch (error) {
                
            }
        }

        resolve();
    });
};

// const patch_wechat_devtools_package_name = function () {
//     info("Patching wechat-devtools package name");

//     return new Promise((resolve, reject) => {
//         spawn(path.resolve(__dirname, "fix-package-name.js"), [], {
//             stdio: "inherit",
//         }).on("close", (code) => {
//             resolve();
//         });
//     });
// };
// const patch_wechat_devtools_editor_selection_autocopy = function () {
//     info("Patching wechat-devtools editor selection autocopy");

//     return new Promise((resolve, reject) => {
//         spawn(path.resolve(__dirname, "fix-selection-copy-node"), [], {
//             stdio: "inherit",
//         }).on("close", (code) => {
//             resolve();
//         });
//     });
// };
// const patch_wechat_devtools_CLI = function () {
//     info("Patching wechat-devtools CLI supports");

//     return new Promise((resolve, reject) => {
//         spawn(path.resolve(__dirname, "fix-cli.sh"), [], {
//             stdio: "inherit",
//         }).on("close", (code) => {
//             resolve();
//         });
//     });
// };
// const patch_wechat_devtools_core = function () {
//     info("Patching wechat-devtools core.wxvpkg");

//     return new Promise((resolve, reject) => {
//         spawn(path.resolve(__dirname, "fix-core.sh"), [], {
//             stdio: "inherit",
//         }).on("close", (code) => {
//             resolve();
//         });
//     });
// };
// const rebuild_wechat_devtools_node_modules = function () {
//     info("Rebuilding wechat-devtools node modules");

//     return new Promise((resolve, reject) => {
//         const nwConfig = require(path.resolve(__dirname, "../conf/nwjs.json"));
//         const e = spawn(
//             path.resolve(__dirname, "rebuild-node-modules.sh"),
//             [nwConfig.version],
//             {
//                 stdio: "inherit",
//             }
//         );
//         e.on("error", (code) => {
//             reject(code);
//         });
//         e.on("close", (code) => {
//             console.info(
//                 `Rebuilding wechat-devtools node modules Result Code: ${code}`
//             );
//             if (0 === code) resolve();
//             else {
//                 reject(code);
//             }
//         });
//     });
// };
// const patch_wechat_devtools = function () {
//     info("Patching wechat-devtools");

//     return new Promise((resolve, reject) => {
//         const exec = spawn(path.resolve(__dirname, "fix-menu.sh"), [], {
//             stdio: "inherit",
//         });
//         exec.on("close", (code) => {
//             resolve();
//         });
//     });
// };
// const patch_other = function () {
//     info("Patching Other");

//     return new Promise((resolve, reject) => {
//         execSync(path.resolve(__dirname, "fix-other.sh"));

//         resolve();
//     });
// };

const start = async () => {
    try {
        const url = await fetching();
        const localPath = await download(url);
        const extractPath = await extract(localPath);
        await upgrade(extractPath);
        // await patch_wechat_devtools_package_name();
        // await patch_wechat_devtools_editor_selection_autocopy();
        // await patch_wechat_devtools_CLI();
        // await patch_wechat_devtools_core();
        // await rebuild_wechat_devtools_node_modules();
        // await patch_wechat_devtools();
        // await patch_other();
        // 写入构建时间戳
        fs.writeFileSync(
            path.resolve(__dirname, "../package.nw/.build_time"),
            "" + parseInt(new Date().getTime() / 1000)
        );
        // 写入版本
        fs.writeFileSync(
            path.resolve(__dirname, "../conf/devtools_v"),
            `${version},${md5}`
        )
        console.log(
            `Succeeded upgrading wechat-devtools to version ${version}`
        );
    } catch (error) {
        console.error("异常", error);
        exit(-1);
    }
};
start();
