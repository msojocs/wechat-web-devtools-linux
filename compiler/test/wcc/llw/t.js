const fs = require('fs')
const path = require('path')

var x=['./miniprogram_npm/miniprogram-barrage/index.wxml','./miniprogram_npm/miniprogram-recycle-view/recycle-item.wxml','./miniprogram_npm/miniprogram-recycle-view/recycle-view.wxml','./miniprogram_npm/wxml-to-canvas/index.wxml','./page/API/components/set-tab-bar/set-tab-bar.wxml','../../../common/head.wxml','../../../common/foot.wxml','./page/API/index.wxml','./page/cloud/index.wxml','./page/common/foot.wxml','./page/common/head.wxml','./page/component/index.wxml','./page/extend/index.wxml'];
const config = {
  num: 4
}
const source = fs.readFileSync(path.resolve(__dirname, './3/linux_output.js')).toString()
const m0Exp = `var m${config.num}=function\\(e,s,r,gg\\){[\\s\\S]*{f:m${config.num},j:\\[.*?\\],i:\\[.*?\\],ti:\\[(.*?)\\],ic:\\[.*?\\]}`
console.log('exp --- ', m0Exp)
let m0 = source.match(new RegExp(m0Exp))
const compIndex = m0[1].match(/\d+/g)
console.log(compIndex)
for(let index of compIndex)
  console.log(x[index])
m0 = m0[0].replace(new RegExp(`m${config.num}`, 'g'), 'm0').replace(new RegExp(`x\\[${config.num}\\]`, 'g'), 'x[0]')