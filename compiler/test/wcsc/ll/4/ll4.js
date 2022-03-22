#!/usr/bin/env node

const { spawn, spawnSync } = require("child_process");
const path = require("path");
const fs = require("fs");
const { exit } = require("process");
const util = require('util')

const projectPath = "/mnt/disk1/WeChatProjects/miniprogram-demo/miniprogram/";
const config = [
    "-db",
    "-pc",
    "70",
    "./packageAPI/pages/api/login/login.wxss",
    "./packageAPI/pages/api/get-user-info/get-user-info.wxss",
    "./packageAPI/pages/api/request-payment/request-payment.wxss",
    "./packageAPI/pages/api/jump/jump.wxss",
    "./packageAPI/pages/api/share/share.wxss",
    "./packageAPI/pages/api/share-button/share-button.wxss",
    "./packageAPI/pages/api/custom-message/custom-message.wxss",
    "./packageAPI/pages/api/subscribe-message/subscribe-message.wxss",
    "./packageAPI/pages/api/choose-address/choose-address.wxss",
    "./packageAPI/pages/api/choose-invoice-title/choose-invoice-title.wxss",
    "./packageAPI/pages/api/soter-authentication/soter-authentication.wxss",
    "./packageAPI/pages/api/setting/setting.wxss",
    "./packageAPI/pages/page/set-navigation-bar-title/set-navigation-bar-title.wxss",
    "./packageAPI/pages/page/navigation-bar-loading/navigation-bar-loading.wxss",
    "./packageAPI/pages/page/navigator/navigator.wxss",
    "./packageAPI/pages/page/pull-down-refresh/pull-down-refresh.wxss",
    "./packageAPI/pages/page/animation/animation.wxss",
    "./packageAPI/pages/page/action-sheet/action-sheet.wxss",
    "./packageAPI/pages/page/modal/modal.wxss",
    "./packageAPI/pages/page/toast/toast.wxss",
    "./packageAPI/pages/page/canvas/canvas.wxss",
    "./packageAPI/pages/page/get-wxml-node-info/get-wxml-node-info.wxss",
    "./packageAPI/pages/page/page-scroll/page-scroll.wxss",
    "./packageAPI/pages/page/intersection-observer/intersection-observer.wxss",
    "./packageAPI/pages/device/clipboard-data/clipboard-data.wxss",
    "./packageAPI/pages/device/bluetooth/bluetooth.wxss",
    "./packageAPI/pages/device/bluetooth/slave/slave.wxss",
    "./packageAPI/pages/device/screen-brightness/screen-brightness.wxss",
    "./packageAPI/pages/device/vibrate/vibrate.wxss",
    "./packageAPI/pages/device/add-contact/add-contact.wxss",
    "./packageAPI/pages/device/wifi/wifi.wxss",
    "./packageAPI/pages/device/get-network-type/get-network-type.wxss",
    "./packageAPI/pages/device/on-network-status-change/on-network-status-change.wxss",
    "./packageAPI/pages/device/get-system-info/get-system-info.wxss",
    "./packageAPI/pages/device/on-compass-change/on-compass-change.wxss",
    "./packageAPI/pages/device/make-phone-call/make-phone-call.wxss",
    "./packageAPI/pages/device/scan-code/scan-code.wxss",
    "./packageAPI/pages/device/on-accelerometer-change/on-accelerometer-change.wxss",
    "./packageAPI/pages/device/capture-screen/capture-screen.wxss",
    "./packageAPI/pages/device/ibeacon/ibeacon.wxss",
    "./packageAPI/pages/device/get-battery-info/get-battery-info.wxss",
    "./packageAPI/pages/media/image/image.wxss",
    "./packageAPI/pages/media/voice/voice.wxss",
    "./packageAPI/pages/media/file/file.wxss",
    "./packageAPI/pages/media/load-font-face/load-font-face.wxss",
    "./packageAPI/pages/media/background-audio/background-audio.wxss",
    "./packageAPI/pages/media/video/video.wxss",
    "./packageAPI/pages/media/audio/audio.wxss",
    "./packageAPI/pages/media/media-container/media-container.wxss",
    "./packageAPI/pages/location/get-location/get-location.wxss",
    "./packageAPI/pages/location/open-location/open-location.wxss",
    "./packageAPI/pages/location/choose-location/choose-location.wxss",
    "./packageAPI/pages/network/request/request.wxss",
    "./packageAPI/pages/network/web-socket/web-socket.wxss",
    "./packageAPI/pages/network/upload-file/upload-file.wxss",
    "./packageAPI/pages/network/download-file/download-file.wxss",
    "./packageAPI/pages/network/mdns/mdns.wxss",
    "./packageAPI/pages/network/udp-socket/udp-socket.wxss",
    "./packageAPI/pages/storage/storage/storage.wxss",
    "./packageAPI/pages/storage/get-background-fetch-data/get-background-fetch-data.wxss",
    "./packageAPI/pages/storage/get-background-prefetch-data/get-background-prefetch-data.wxss",
    "./packageAPI/pages/performance/get-performance/get-performance.wxss",
    "./packageAPI/pages/worker/worker/worker.wxss",
    "./packageAPI/pages/framework/two-way-bindings/two-way-bindings.wxss",
    "./packageAPI/pages/framework/wxs/wxs.wxss",
    "./packageAPI/pages/framework/resizable/resizable.wxss",
    "./packageAPI/pages/framework/wxs/movable.wxss",
    "./packageAPI/pages/framework/wxs/sidebar.wxss",
    "./packageAPI/pages/framework/wxs/stick-top.wxss",
    "./packageAPI/pages/framework/wxs/nearby.wxss",
    "./app.wxss",
    "./common/lib/weui.wxss",
    "./miniprogram_npm/miniprogram-barrage/index.wxss",
    "./miniprogram_npm/miniprogram-recycle-view/recycle-item.wxss",
    "./miniprogram_npm/miniprogram-recycle-view/recycle-view.wxss",
    "./miniprogram_npm/wxml-to-canvas/index.wxss",
    "./page/API/components/set-tab-bar/set-tab-bar.wxss",
    "./page/API/index.wxss",
    "./page/cloud/index.wxss",
    "./page/common/common.wxss",
    "./page/common/index.wxss",
    "./page/common/lib/weui.wxss",
    "./page/component/index.wxss",
    "./page/extend/index.wxss",
    "--subpackage",
    "packageAPI",
    "-ll",
];

const test_wine = () => {
    const wine = spawn(
        path.resolve(__dirname, "../../../../../package.nw/js/vendor/wcsc.exe"),
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
                // delete result.generateFunctionContent["__COMMON__"];
                result = JSON.stringify(result, null, 4);
                // result = result.common;
                fs.writeFileSync(
                    path.resolve(__dirname, "./wine_output.json"),
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
        path.resolve(__dirname, "../../../../nodejs/wcsc"),
        config,
        {
            cwd: projectPath,
            env: {
                WX_DEBUG_COMPILER_OUTPUT: __dirname,
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
                // delete result.generateFunctionContent["__COMMON__"];
                result = JSON.stringify(result, null, 4);
                // result = result.common;
                fs.writeFileSync(
                    path.resolve(__dirname, "./node_output.json"),
                    result
                );
                fs.writeFileSync(
                    path.resolve(__dirname, "./node_stderr.json"),
                    Buffer.concat(errData)
                );
                resolve(result);
            } else {
                console.error("错误");
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
        const t1 = JSON.parse(node_result);
        const t2 = JSON.parse(wine_result);
        console.log(util.isDeepStrictEqual(t1, t2))
    } catch (err) {
        console.error("错误：", err);
    }
};
test();
