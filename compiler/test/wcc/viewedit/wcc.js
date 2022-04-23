const wcc = require('../../../package.nw/node_modules/wcc')
const fs = require('fs')

const options = {
  "files": ["./pages/index/index.wxml", "./pages/logs/logs.wxml"],
  "debugWXS": false,
  "debug": true,
  "genfuncname": "$gwx",
  "wxmlCompileConfig": "2>_<9401./pages/index/index.wxml>_<94010>_<9401./pages/logs/logs.wxml>_<94010",
  "wxmlCompileConfigSplit": ">_<9401",
  "replaceContent": {
    "./pages/index/index.wxml": "<!--index.wxml-->\n<view class=\"container\" data-ib-structured-id=\"0\">\n  <view class=\"userinfo\" data-ib-structured-id=\"1\">\n    <block wx:if=\"{{canIUseOpenData}}\" data-ib-structured-id=\"2\">\n      <view class=\"userinfo-avatar\" bindtap=\"bindViewTap\" style=\"width: 183rpx; height: 148rpx; display: block; box-sizing: border-box\" data-ib-structured-id=\"3\">\n        <open-data type=\"userAvatarUrl\" data-ib-structured-id=\"4\"></open-data>\n      </view>\n      <open-data type=\"userNickName\" data-ib-structured-id=\"5\"></open-data>\n    </block>\n    <block wx:elif=\"{{!hasUserInfo}}\" data-ib-structured-id=\"6\">\n      <button wx:if=\"{{canIUseGetUserProfile}}\" bindtap=\"getUserProfile\" data-ib-structured-id=\"7\"> 获取头像昵称 </button>\n      <button wx:elif=\"{{canIUse}}\" open-type=\"getUserInfo\" bindgetuserinfo=\"getUserInfo\" data-ib-structured-id=\"8\"> 获取头像昵称 </button>\n      <view wx:else data-ib-structured-id=\"9\"> 请使用1.4.4及以上版本基础库 </view>\n    </block>\n    <block wx:else data-ib-structured-id=\"10\">\n      <image bindtap=\"bindViewTap\" class=\"userinfo-avatar\" src=\"{{userInfo.avatarUrl}}\" mode=\"cover\" data-ib-structured-id=\"11\"></image>\n      <text class=\"userinfo-nickname\" data-ib-structured-id=\"12\">{{userInfo.nickName}}</text>\n    </block>\n  </view>\n  <view class=\"usermotto\" style=\"width: 197rpx; height: 94rpx; display: block; box-sizing: border-box\" data-ib-structured-id=\"13\">\n    <text class=\"user-motto\" data-ib-structured-id=\"14\">{{motto}}</text>\n  </view>\n</view>\n"
  },
  "cwd": "/home/msojocs/Documents/we1",
  "lazyloadConfig": "./pages/index/index>_<9401./pages/logs/logs"
}
wcc(options)
  .then(res => {
    console.log(res)
    fs.writeFileSync('test/wcc/viewedit/1/node.json', res)
  })