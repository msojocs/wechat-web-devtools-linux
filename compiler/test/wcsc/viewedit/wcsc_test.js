const wcsc = require("../../../package.nw/node_modules/wcsc");
const fs = require("fs");

let options = {
    files: ["./pages/index/index.wxss", "./pages/logs/logs.wxss", "./app.wxss"],
    contents: [
        "/**index.wxss**/\n.userinfo {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  color: #aaa;\n}\n\n.userinfo-avatar {\n  overflow: hidden;\n  width: 128rpx;\n  height: 128rpx;\n  margin: 20rpx;\n  border-radius: 50%;\n}\n\n.usermotto {\n  margin-top: 200px;\n}",
        ".log-list {\n  display: flex;\n  flex-direction: column;\n  padding: 40rpx;\n}\n.log-item {\n  margin: 10rpx;\n}\n",
        "/**app.wxss**/\n.container {\n  height: 100%;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: space-between;\n  padding: 200rpx 0;\n  box-sizing: border-box;\n} \n",
    ],
    pageCount: 2,
    cwd: "/home/msojocs/Documents/we1",
    replaceContent: {
        "./pages/index/index.wxss":
            "/**index.wxss**/\n.userinfo {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  color: #aaa;\n}\n\n.userinfo-avatar {\n  overflow: hidden;\n  width: 128rpx;\n  height: 128rpx;\n  margin: 20rpx;\n  border-radius: 50%;\n}\n\n.usermotto {\n  margin-top: 200px;\n}",
    },
    debug: true,
    classPrefix: "",
    lazyload: false,
};
options = {
    pageCount: 54,
    files: [
        "./pages/login/login.wxss",
        "./pages/index/index.wxss",
        "./pages/articleView/articleView.wxss",
        "./pages/calendar/calendar.wxss",
        "./pages/card/card.wxss",
        "./pages/checkIn/edit.wxss",
        "./pages/checkIn/list.wxss",
        "./pages/courseTable/courseTable.wxss",
        "./pages/courseTable/imgCropper/imgCropper.wxss",
        "./pages/exam/exam.wxss",
        "./pages/grade/grade.wxss",
        "./pages/laboratory/list.wxss",
        "./pages/laboratory/detail.wxss",
        "./pages/maintenance/maintenance.wxss",
        "./pages/my/ADMag/ADMag.wxss",
        "./pages/my/ADMag/watchAD/watchAD.wxss",
        "./pages/my/dataMag/dataMag.wxss",
        "./pages/my/my.wxss",
        "./pages/my/sub/sub.wxss",
        "./pages/my/sso/sso.wxss",
        "./pages/newsList/newsList.wxss",
        "./pages/officeGrade/query.wxss",
        "./pages/THEOL/dir/dir.wxss",
        "./pages/THEOL/THEOL.wxss",
        "./pages/THEOL/tree/tree.wxss",
        "./pages/auth/auth.wxss",
        "./pages/my/bind/bind.wxss",
        "./pages/my/register/register.wxss",
        "./pages/my/bind/mini.wxss",
        "./pages/terms/privacy.wxss",
        "./pages/resources/list.wxss",
        "./pages/my/about.wxss",
        "./components/card.wxss",
        "./components/beat-char/beat-char.wxss",
        "./components/mytree/mytree.wxss",
        "./components/scroll/index.wxss",
        "./components/tab/index.wxss",
        "./miniprogram_npm/weui-miniprogram/cell/cell.wxss",
        "./miniprogram_npm/weui-miniprogram/cells/cells.wxss",
        "./miniprogram_npm/weui-miniprogram/loading/loading.wxss",
        "./node-modules/mp-html/dist/uni-app/components/mp-html/mp-html.wxss",
        "./node-modules/mp-html/dist/uni-app/components/mp-html/node/node.wxss",
        "./pages/my/info.wxss",
        "./uni_modules/uni-card/components/uni-card/uni-card.wxss",
        "./uni_modules/uni-icons/components/uni-icons/uni-icons.wxss",
        "./uni_modules/uni-row/components/uni-col/uni-col.wxss",
        "./uni_modules/uni-row/components/uni-row/uni-row.wxss",
        "./uni_modules/uni-title/components/uni-title/uni-title.wxss",
        "./wxcomponents/dynamicForm/index.wxss",
        "./wxcomponents/dynamicForm/components/timePicker/timePicker.wxss",
        "./wxcomponents/dynamicForm/vant/icon/index.wxss",
        "./wxcomponents/dynamicForm/vant/info/index.wxss",
        "./wxcomponents/dynamicForm/vant/uploader/index.wxss",
        "./wxcomponents/image-cropper/image-cropper.wxss",
        "./app.wxss",
        "./common/main.wxss",
        "./wxcomponents/dynamicForm/index-wxa-auto-dark.wxss",
        "./wxcomponents/dynamicForm/components/timePicker/timePicker-wxa-auto-dark.wxss",
        "./wxcomponents/dynamicForm/vant/common/index-wxa-auto-dark.wxss",
        "./wxcomponents/dynamicForm/vant/common/index.wxss",
        "./wxcomponents/dynamicForm/vant/icon/index-wxa-auto-dark.wxss",
        "./wxcomponents/dynamicForm/vant/info/index-wxa-auto-dark.wxss",
        "./wxcomponents/dynamicForm/vant/uploader/index-wxa-auto-dark.wxss",
    ],
    cwd: "/mnt/disk1/Project/WeCuit-Project/WeCuit-Mini-uni-test_uni_vue-cli/dist/build/mp-weixin",
    lazyload: true,
    replaceContent: {
        "./pages/login/login.wxss":
            ".login-page.data-v-53bada72{display:flex;flex-direction:column;justify-content:flex-end;height:100vh}.logo-area.data-v-53bada72{display:flex;justify-content:center;height:80%}.logo.data-v-53bada72{display:flex;align-items:center}.logo-item.data-v-53bada72{height:200rpx;width:200rpx;border-radius:calc(50%)}.login-area.data-v-53bada72{display:flex;justify-content:center;align-items:center;margin:50rpx}.loading.data-v-53bada72{margin-top:5rpx;margin-right:10rpx;transform-origin:center center;-webkit-animation:rotate-data-v-53bada72 1s linear infinite;animation:rotate-data-v-53bada72 1s linear infinite}@-webkit-keyframes rotate-data-v-53bada72{0%{transform:rotate(0)}50%{transform:rotate(180deg)}100%{transform:rotate(1turn)}}@keyframes rotate-data-v-53bada72{0%{transform:rotate(0)}50%{transform:rotate(180deg)}100%{transform:rotate(1turn)}}",
    },

    debug: true,
};
wcsc(options).then((res) => {
    // console.log(res);
    fs.writeFileSync(
        "test/wcsc/viewedit/1/node.json",
        JSON.stringify(res, null, 2)
    );
});
