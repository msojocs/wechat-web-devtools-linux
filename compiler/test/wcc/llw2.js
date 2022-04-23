#!/usr/bin/env node

const { spawn, spawnSync } = require("child_process");
const path = require("path");
const { exit } = require("process");

const projectPath =
    "/mnt/disk1/Project/WeCuit-Project/WeCuit-Mini-uni-test_uni_vue-cli/dist/dev/mp-weixin";
const config = [
    "-ds",
    "-d",
    "--split",
    ">_<398",
    "-cc",
    "56>_<398./components/beat-char/beat-char.wxml>_<3980>_<398./components/card.wxml>_<3980>_<398./components/mytree/mytree.wxml>_<3981>_<398mytree>_<398./components/scroll/index.wxml>_<3980>_<398./components/tab/index.wxml>_<3980>_<398./miniprogram_npm/weui-miniprogram/cell/cell.wxml>_<3981>_<398mp-cells>_<398./miniprogram_npm/weui-miniprogram/cells/cells.wxml>_<3980>_<398./miniprogram_npm/weui-miniprogram/loading/loading.wxml>_<3980>_<398./node-modules/mp-html/dist/uni-app/components/mp-html/mp-html.wxml>_<3981>_<398node>_<398./node-modules/mp-html/dist/uni-app/components/mp-html/node/node.wxml>_<3981>_<398node>_<398./pages/THEOL/THEOL.wxml>_<3982>_<398mp-cell>_<398mp-cells>_<398./pages/THEOL/dir/dir.wxml>_<3982>_<398mp-cell>_<398mp-cells>_<398./pages/THEOL/tree/tree.wxml>_<3982>_<398mytree>_<398mp-loading>_<398./pages/articleView/articleView.wxml>_<3981>_<398html-parser>_<398./pages/auth/auth.wxml>_<3983>_<398uni-row>_<398uni-col>_<398uni-title>_<398./pages/calendar/calendar.wxml>_<3980>_<398./pages/card/card.wxml>_<3982>_<398mp-cell>_<398mp-cells>_<398./pages/checkIn/edit.wxml>_<3983>_<398d-form>_<398mp-cell>_<398mp-cells>_<398./pages/checkIn/list.wxml>_<3982>_<398mp-cell>_<398mp-cells>_<398./pages/courseTable/courseTable.wxml>_<3980>_<398./pages/courseTable/imgCropper/imgCropper.wxml>_<3981>_<398image-cropper>_<398./pages/exam/exam.wxml>_<3980>_<398./pages/grade/grade.wxml>_<3980>_<398./pages/index/index.wxml>_<3980>_<398./pages/laboratory/detail.wxml>_<3980>_<398./pages/laboratory/list.wxml>_<3980>_<398./pages/login/login.wxml>_<3980>_<398./pages/maintenance/maintenance.wxml>_<3981>_<398beat-char>_<398./pages/my/ADMag/ADMag.wxml>_<3980>_<398./pages/my/ADMag/watchAD/watchAD.wxml>_<3980>_<398./pages/my/about.wxml>_<3980>_<398./pages/my/bind/bind.wxml>_<3980>_<398./pages/my/bind/mini.wxml>_<3980>_<398./pages/my/dataMag/dataMag.wxml>_<3980>_<398./pages/my/info.wxml>_<3982>_<398uni-row>_<398uni-col>_<398./pages/my/my.wxml>_<3982>_<398uni-card>_<398info>_<398./pages/my/register/register.wxml>_<3980>_<398./pages/my/sso/forget.wxml>_<3980>_<398./pages/my/sso/sso.wxml>_<3982>_<398mp-cells>_<398mp-cell>_<398./pages/my/sub/sub.wxml>_<3982>_<398mp-cell>_<398mp-cells>_<398./pages/newsList/newsList.wxml>_<3982>_<398tab>_<398scroll>_<398./pages/officeGrade/query.wxml>_<3982>_<398mp-cells>_<398mp-cell>_<398./pages/resources/list.wxml>_<3980>_<398./pages/terms/privacy.wxml>_<3981>_<398card>_<398./pages/terms/terms.wxml>_<3980>_<398./uni_modules/uni-card/components/uni-card/uni-card.wxml>_<3981>_<398uni-icons>_<398./uni_modules/uni-icons/components/uni-icons/uni-icons.wxml>_<3980>_<398./uni_modules/uni-row/components/uni-col/uni-col.wxml>_<3980>_<398./uni_modules/uni-row/components/uni-row/uni-row.wxml>_<3980>_<398./uni_modules/uni-title/components/uni-title/uni-title.wxml>_<3980>_<398./wxcomponents/dynamicForm/components/timePicker/timePicker.wxml>_<3980>_<398./wxcomponents/dynamicForm/index.wxml>_<3983>_<398van-icon>_<398van-uploader>_<398time-picker>_<398./wxcomponents/dynamicForm/vant/icon/index.wxml>_<3981>_<398van-info>_<398./wxcomponents/dynamicForm/vant/info/index.wxml>_<3980>_<398./wxcomponents/dynamicForm/vant/uploader/index.wxml>_<3981>_<398van-icon>_<398./wxcomponents/image-cropper/image-cropper.wxml>_<3980",
    "-llw",
    "./components/beat-char/beat-char>_<398./components/card>_<398./components/mytree/mytree>_<398./components/scroll/index>_<398./components/tab/index>_<398./miniprogram_npm/weui-miniprogram/cell/cell>_<398./miniprogram_npm/weui-miniprogram/cells/cells>_<398./miniprogram_npm/weui-miniprogram/loading/loading>_<398./node-modules/mp-html/dist/uni-app/components/mp-html/mp-html>_<398./node-modules/mp-html/dist/uni-app/components/mp-html/node/node>_<398./pages/THEOL/THEOL>_<398./pages/THEOL/dir/dir>_<398./pages/THEOL/tree/tree>_<398./pages/articleView/articleView>_<398./pages/auth/auth>_<398./pages/calendar/calendar>_<398./pages/card/card>_<398./pages/checkIn/edit>_<398./pages/checkIn/list>_<398./pages/courseTable/courseTable>_<398./pages/courseTable/imgCropper/imgCropper>_<398./pages/exam/exam>_<398./pages/grade/grade>_<398./pages/index/index>_<398./pages/laboratory/detail>_<398./pages/laboratory/list>_<398./pages/login/login>_<398./pages/maintenance/maintenance>_<398./pages/my/ADMag/ADMag>_<398./pages/my/ADMag/watchAD/watchAD>_<398./pages/my/about>_<398./pages/my/bind/bind>_<398./pages/my/bind/mini>_<398./pages/my/dataMag/dataMag>_<398./pages/my/info>_<398./pages/my/my>_<398./pages/my/register/register>_<398./pages/my/sso/forget>_<398./pages/my/sso/sso>_<398./pages/my/sub/sub>_<398./pages/newsList/newsList>_<398./pages/officeGrade/query>_<398./pages/resources/list>_<398./pages/terms/privacy>_<398./pages/terms/terms>_<398./uni_modules/uni-card/components/uni-card/uni-card>_<398./uni_modules/uni-icons/components/uni-icons/uni-icons>_<398./uni_modules/uni-row/components/uni-col/uni-col>_<398./uni_modules/uni-row/components/uni-row/uni-row>_<398./uni_modules/uni-title/components/uni-title/uni-title>_<398./wxcomponents/dynamicForm/components/timePicker/timePicker>_<398./wxcomponents/dynamicForm/index>_<398./wxcomponents/dynamicForm/vant/icon/index>_<398./wxcomponents/dynamicForm/vant/info/index>_<398./wxcomponents/dynamicForm/vant/uploader/index>_<398./wxcomponents/image-cropper/image-cropper",
    "./components/beat-char/beat-char.wxml",
    "./components/card.wxml",
    "./components/mytree/mytree.wxml",
    "./components/scroll/index.wxml",
    "./components/tab/index.wxml",
    "./miniprogram_npm/weui-miniprogram/cell/cell.wxml",
    "./miniprogram_npm/weui-miniprogram/cells/cells.wxml",
    "./miniprogram_npm/weui-miniprogram/loading/loading.wxml",
    "./node-modules/mp-html/dist/uni-app/components/mp-html/mp-html.wxml",
    "./node-modules/mp-html/dist/uni-app/components/mp-html/node/node.wxml",
    "./pages/THEOL/THEOL.wxml",
    "./pages/THEOL/dir/dir.wxml",
    "./pages/THEOL/tree/tree.wxml",
    "./pages/articleView/articleView.wxml",
    "./pages/auth/auth.wxml",
    "./pages/calendar/calendar.wxml",
    "./pages/card/card.wxml",
    "./pages/checkIn/edit.wxml",
    "./pages/checkIn/list.wxml",
    "./pages/courseTable/courseTable.wxml",
    "./pages/courseTable/imgCropper/imgCropper.wxml",
    "./pages/exam/exam.wxml",
    "./pages/grade/grade.wxml",
    "./pages/index/index.wxml",
    "./pages/laboratory/detail.wxml",
    "./pages/laboratory/list.wxml",
    "./pages/login/login.wxml",
    "./pages/maintenance/maintenance.wxml",
    "./pages/my/ADMag/ADMag.wxml",
    "./pages/my/ADMag/watchAD/watchAD.wxml",
    "./pages/my/about.wxml",
    "./pages/my/bind/bind.wxml",
    "./pages/my/bind/mini.wxml",
    "./pages/my/dataMag/dataMag.wxml",
    "./pages/my/info.wxml",
    "./pages/my/my.wxml",
    "./pages/my/register/register.wxml",
    "./pages/my/sso/forget.wxml",
    "./pages/my/sso/sso.wxml",
    "./pages/my/sub/sub.wxml",
    "./pages/newsList/newsList.wxml",
    "./pages/officeGrade/query.wxml",
    "./pages/resources/list.wxml",
    "./pages/terms/privacy.wxml",
    "./pages/terms/terms.wxml",
    "./uni_modules/uni-card/components/uni-card/uni-card.wxml",
    "./uni_modules/uni-icons/components/uni-icons/uni-icons.wxml",
    "./uni_modules/uni-row/components/uni-col/uni-col.wxml",
    "./uni_modules/uni-row/components/uni-row/uni-row.wxml",
    "./uni_modules/uni-title/components/uni-title/uni-title.wxml",
    "./wxcomponents/dynamicForm/components/timePicker/timePicker.wxml",
    "./wxcomponents/dynamicForm/index.wxml",
    "./wxcomponents/dynamicForm/vant/icon/index.wxml",
    "./wxcomponents/dynamicForm/vant/info/index.wxml",
    "./wxcomponents/dynamicForm/vant/uploader/index.wxml",
    "./wxcomponents/image-cropper/image-cropper.wxml",
    "./pages/grade/check.wxs",
    "./pages/laboratory/labDetail.wxs",
    "-gn",
    "$gwx",
];

const test_wine = () => {
    const wine = spawn(
        path.resolve(__dirname, "../../../package.nw/js/vendor/wcc.exe"),
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
            console.log("n: ", n);
            if (0 === n) {
                const result = Buffer.concat(spwanData).toString();
                process.stdout.write(result);
                resolve(result);
            } else {
                process.stderr.write(Buffer.concat(errData).toString());
                process.stderr.write(Buffer.concat(spwanData).toString());
                reject(n);
            }
        });
    });
};
const test_node = () => {
    
    const node_exec = spawn(
        path.resolve(__dirname, "../../../compiler/nodejs/wcc"),
        config,
        {
            cwd: projectPath,
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
            console.log("n: ", n);
            if (0 === n) {
                const result = Buffer.concat(spwanData).toString();
                // require('fs').writeFileSync('/mnt/disk2/wechat-web-devtools-linux/tmp/llw2.json', result)
                process.stdout.write(result);
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
        const wine_result = await test_wine();
        const node_result = await test_node();
        console.log(wine_result === node_result)
    } catch (err) {
        console.error('错误：', err);
    }
};
test();
