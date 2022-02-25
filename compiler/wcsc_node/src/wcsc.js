const { spawn, spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const os = require('os')
const { throws } = require('assert')

/**
 * 获取 wxss 编译器路径
 */
let wxssParserPath = ''
function getWXSSParsePath() {
  if (wxssParserPath) return wxssParserPath

  const fileName = process.platform === 'darwin' ? '../bin/mac/wcsc' : process.platform === 'linux' ? '../bin/linux/wcsc' : '../bin/windows/wcsc.exe'
  wxssParserPath = path.join(__dirname, fileName)

  // 尝试修改权限
  try {
    fs.chmodSync(wxssParserPath, 0o777)
  } catch (err) {
    // ignore
  }

  return wxssParserPath
}

/**
 * 获取完整文件列表
 */
function getAllFiles(rootPath, files) {
  const ret = []
  let compWxssNum = 0

  for (let i = 0, len = files.length; i < len; i++) {
    const file = files[i]

    let fileJson = null
    try {
      fileJson = require(path.join(rootPath, `${file}.json`))
    } catch(err) {
      // ignore
    }

    if (fileJson) {
      // 组件 wxss
      compWxssNum++
      ret.unshift(`${file}.wxss`)
    } else {
      ret.push(`${file}.wxss`)
    }
  }

  return {
    list: ret,
    compWxssNum,
  }
}

/**
 * 编译 wxss 到 js
 */
async function wxssToJS(options) {
  // 创建临时目录
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wcsc_'))
  // 判断是否replace,是写入replace,否则拷贝文件到临时目录
  for(let file of options.files){
    if (typeof options.replaceContent[file] === 'string') {
      // 写入替换内容
      fs.mkdirSync(path.dirname(path.resolve(tmp, file)), {recursive:true})
      fs.writeFileSync(path.resolve(tmp, file), options.replaceContent[file])
    }else{
      // 复制原文件
      fs.mkdirSync(path.dirname(path.resolve(tmp, file)), {recursive:true})
      fs.copyFileSync(path.resolve(options.cwd, file), path.resolve(tmp, file))
    }
  }
  // 使用临时目录执行wcc
  options.cwd = tmp

  let rootPath = options.cwd, files=options.files
  // files = getAllFiles(rootPath, files)

  const args = ['-db', '-pc', String(options.pageCount)].concat(files)

  const wxssParserPath = getWXSSParsePath()
  // console.warn('wcsc args: ', args)
  // const wcsc = spawnSync(wxssParserPath, args, { cwd: rootPath })
  return new Promise((resolve, reject)=>{
      
    const wcsc = spawn(wxssParserPath, args, {
      cwd: rootPath,
    });
    const spwanData = [],
        errData = [];
    wcsc.stdout.on("data", (e) => {
        spwanData.push(e);
    });
    wcsc.stderr.on("data", (e) => {
        errData.push(e);
    });
    wcsc.on("close", (code) => {
      console.warn('close', new Date().getTime()/1000)
      if (code === 0) {
        let result = Buffer.concat(spwanData).toString();
        if(options.lazyload){
          result = result.split('=')
          let funcList = {}
          for (let i = 0, len = result.length; i < len && result[i + 1]; i += 2) {
            funcList[result[i]] = result[i + 1]
              .replace(
                /[^\\]((\\x[\da-f]{2}|\\u[\da-f]{4})){1,}/gi,
                function ($0, $1, $2) {
                    return eval('"' + $0 + '"');
                }
              )
              .replace(/\\[\s\S]{1}/gi, function ($0, $1, $2) {
                // console.log($0, $1)
                const c = $0 === "\\n" ? "\n" : $0[1];
                return c
              })
          }
          const t = funcList
          funcList = {
            common: t.comm,
            pageWxss: {}
          }
          for(let key in t){
            if(key.endsWith('.wxss')){
              funcList.pageWxss[key] = t[key]
            }
          }
          result = funcList
        }
        resolve(result) 
      } else {
        throw new Error(`编译 .wxss 文件错误(${wcsc.status})：${wcsc.stderr.toString()}`)
      }
    })
  })

}

module.exports = wxssToJS
