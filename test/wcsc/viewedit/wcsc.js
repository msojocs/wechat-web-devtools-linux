const wcsc = require('../../../package.nw/node_modules/wcsc')
const fs = require('fs')

const options = {
  "files": [
    "./pages/index/index.wxss",
    "./pages/logs/logs.wxss",
    "./app.wxss"],
  "contents": [
    "/**index.wxss**/\n.userinfo {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  color: #aaa;\n}\n\n.userinfo-avatar {\n  overflow: hidden;\n  width: 128rpx;\n  height: 128rpx;\n  margin: 20rpx;\n  border-radius: 50%;\n}\n\n.usermotto {\n  margin-top: 200px;\n}", ".log-list {\n  display: flex;\n  flex-direction: column;\n  padding: 40rpx;\n}\n.log-item {\n  margin: 10rpx;\n}\n", "/**app.wxss**/\n.container {\n  height: 100%;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: space-between;\n  padding: 200rpx 0;\n  box-sizing: border-box;\n} \n"
  ],
  "pageCount": 2,
  "cwd": "/home/msojocs/Documents/we1",
  "replaceContent": {
    "./pages/index/index.wxss": "/**index.wxss**/\n.userinfo {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  color: #aaa;\n}\n\n.userinfo-avatar {\n  overflow: hidden;\n  width: 128rpx;\n  height: 128rpx;\n  margin: 20rpx;\n  border-radius: 50%;\n}\n\n.usermotto {\n  margin-top: 200px;\n}"
  },
  "debug": true,
  "classPrefix": "",
  "lazyload": true
}
wcsc(options)
.then(res=>{
  console.log(res)
  fs.writeFileSync('test/wcsc/viewedit/1/node.json', JSON.stringify(res, null, 2))
})