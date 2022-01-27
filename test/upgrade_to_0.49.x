#!/usr/bin/env node

const path = require("path")
const fs = require("fs")
const {execSync} = require('child_process')

const workDir = path.resolve(__dirname, "../package.nw")
if(fs.existsSync(`${workDir}/core.wxvpkg`) && fs.statSync(`${workDir}/core.wxvpkg`).isFile())
  fs.renameSync(`${workDir}/core.wxvpkg`, `${workDir}/core.wxvpkg1`)

if(!fs.existsSync(`${workDir}/core.wxvpkg1`)){
  console.error('错误')
  exit(-1)
}

console.log(`unwxapkg ${workDir}/core.wxvpkg1 ${workDir}/core.wxvpkg.ext`)
execSync(`cd ${workDir} && unwxapkg core.wxvpkg1 core.wxvpkg.ext`)
const search = execSync(`grep -lr "new_instance" ${workDir}/core.wxvpkg.ext`)
console.log(search.toString())
const filepath = search.toString();
execSync(`sed -i 's/"new_instance",/"new_instance","mixed_context",/g' ${filepath}`)
execSync(`sed -i 's/o.new_instance=!0,/o.new_instance=!0,o.mixed_context=!0,/g' ${filepath}`)
execSync(`node ${path.resolve(__dirname, "pack")}`)
// # cd ../package.nw
// # mv core.wxvpkg core.wxvpkg.1
// # unwxapkg core.wxvpkg.1 core.wxvpkg1
// # 添加mixed_context
// # 打包
// # unwxapkg node_modules.wxvpkg node_modules

// # mixed_context