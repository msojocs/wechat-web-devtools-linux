const fs = require("fs");
const path = require("path");

var x = [
    "./miniprogram_npm/miniprogram-barrage/index.wxml",
    "./miniprogram_npm/miniprogram-recycle-view/recycle-item.wxml",
    "./miniprogram_npm/miniprogram-recycle-view/recycle-view.wxml",
    "./miniprogram_npm/wxml-to-canvas/index.wxml",
    "./page/API/components/set-tab-bar/set-tab-bar.wxml",

    "../../../common/head.wxml",
    "../../../common/foot.wxml",
    "./page/API/index.wxml",
    "./page/cloud/index.wxml",
    "./page/common/foot.wxml",
    
    "./page/common/head.wxml",
    "./page/component/index.wxml",
    "./page/extend/index.wxml",
];
const config = {
    num: 4,
};
let content = "";
const funcName = "$gwx";
const source = fs
    .readFileSync(path.resolve(__dirname, "./3/linux_output.js"))
    .toString();
console.log(
    path.join(
        path.dirname("./page/API/components/set-tab-bar/set-tab-bar.wxml"),
        "../../../common/head.wxml"
    )
);
// "./page/common/head.wxml"
process.exit(0);
// 引入解析
const deps = source.matchAll(/_ai\(.*?,x\[(\d+)\],.*?,x\[(\d+)\],\d+,\d+\)/g);
console.log(deps);
for (let dep of deps) {
    console.log(dep[0]);
    console.log(dep[1]);
    console.log(dep[2]);
}

// gz函数2
const exp = `function gz\\${funcName}_${
    config.num + 1
}\\(\\)\\{[\\s\\S]*?__WXML_GLOBAL__\\.ops_cached\\.\\${funcName}_${
    config.num + 1
}\n}`;

// console.log('exp --- ', exp)
const gz = source.match(new RegExp(exp));
// console.log(gz)
content += gz[0].replace(
    new RegExp(`\\${funcName}\\_\\d+`, "g"),
    `${config.funcName}_1`
);
