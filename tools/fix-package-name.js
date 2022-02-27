#!/usr/bin/env node
const path = require("path");
const fs = require("fs");

const parseFile = function (path) {

    if (!fs.existsSync(path)) {
        console.error(`${path}文件不存在`)
        return;
    }
    let content = JSON.parse(fs.readFileSync(path, "utf8"));

    content.name = "wechat_devtools";
    // 开启调试，更新参数
    content['chromium-args'] = content['chromium-args'].replace('--disable-devtools', '--mixed-context').replace('--ignore-gpu-blacklist', '--ignore-gpu-blocklist')
    content.window.height = content.window.width = 1000
    fs.writeFileSync(path, JSON.stringify(content));

};

let basedir = __dirname;
if(undefined !== process.env['srcdir'])
    basedir = process.env['srcdir'] + '/tools';
parseFile(path.resolve(basedir, "../package.nw/package.json"));
parseFile(path.resolve(basedir, "../package.nw/package-lock.json"));
