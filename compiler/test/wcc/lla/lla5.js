#!/usr/bin/env node

const { spawn, spawnSync } = require("child_process");
const path = require("path");
const fs = require("fs");
const { exit } = require("process");

const projectPath = "/home/msojocs/Documents/we1";
const config = ["-d","--split",">_<2460","-xc","2>_<2460./pages/index/index.wxml>_<24600>_<2460./pages/logs/logs.wxml>_<24600","-lla","./pages/index/index>_<2460./pages/logs/logs","./pages/index/index.wxml","./pages/logs/logs.wxml","-gn","$gwx"]
const id = 5;

const test_wine = () => {
    const wine = spawn(
        path.resolve(__dirname, "../../../../package.nw/js/vendor/wcc.exe"),
        config,
        {
            cwd: projectPath,
        }
    );
    const spwanData = [],
        errData = [];
    wine.stdout.on("data", (e) => {
        spwanData.push(e);
    });
    wine.stderr.on("data", (e) => {
        errData.push(e);
    });
    return new Promise((resolve, reject) => {
        wine.on("close", (n) => {
            console.log("wine n: ", n);
            if (0 === n) {
                let result = Buffer.concat(spwanData).toString();
                result = JSON.parse(result);
                // result = result.generateFunctionContent["__COMMON__"];
                // delete result.generateFunctionContent["__COMMON__"];
                result = JSON.stringify(result, null, 4);
                fs.writeFileSync(
                    path.resolve(__dirname, `./${id}/wine_output.json`),
                    result
                );
                // process.stdout.write(result);
                resolve(result);
            } else {
                process.stderr.write(
                    "wine error:",
                    Buffer.concat(errData).toString()
                );
                // process.stderr.write(Buffer.concat(spwanData).toString());
                reject(n);
            }
        });
    });
};
const test_node = () => {
    const node_exec = spawn(
        path.resolve(__dirname, "../../../nodejs/wcc"),
        config,
        {
            cwd: projectPath,
            env: {
                WX_DEBUG_COMPILER_OUTPUT: path.resolve(__dirname, "./" + id),
            },
            // stdio: 'inherit'
        }
    );
    const spwanData = [],
        errData = [];
    node_exec.stdout.on("data", (e) => {
        spwanData.push(e);
        // console.log(e.toString())
    });
    node_exec.stderr.on("data", (e) => {
        errData.push(e);
        // console.log(e.toString())
    });
    return new Promise((resolve, reject) => {
        node_exec.on("close", (n) => {
            console.log("node n: ", n);
            if (0 === n) {
                let result = Buffer.concat(spwanData).toString();
                // require('fs').writeFileSync('/mnt/disk2/wechat-web-devtools-linux/tmp/llw2.json', result)
                // process.stdout.write(result);
                result = JSON.parse(result);
                // fs.writeFileSync(
                //     path.resolve(__dirname, "./4/node_output1.json"),
                //     JSON.stringify(result, null, 4)
                // );
                // result = result.generateFunctionContent["__COMMON__"];
                // delete result.generateFunctionContent["__COMMON__"];
                result = JSON.stringify(result, null, 4);
                fs.writeFileSync(
                    path.resolve(__dirname, `./${id}/node_output.json`),
                    result
                );
                fs.writeFileSync(
                    path.resolve(__dirname, `./${id}/node_stderr.json`),
                    Buffer.concat(errData)
                );
                resolve(result);
            } else {
                process.stderr.write(Buffer.concat(errData).toString());
                // process.stderr.write(Buffer.concat(spwanData).toString());
                reject(n);
            }
        });
    });
};

const test = async () => {
    try {
        const node_result = await test_node();
        const wine_result = await test_wine();
        console.log("结果是否一致：", wine_result.trim() === node_result);
    } catch (err) {
        console.error("错误：", err);
    }
};
test();
