const { spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')

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
function wxssToJS(rootPath, files, options) {
  // files = getAllFiles(rootPath, files)

  const args = ['-db', '-pc', String(options.pageCount)].concat(files)

  const wxssParserPath = getWXSSParsePath()
  console.warn('wcsc args: ', args)
  const wcsc = spawnSync(wxssParserPath, args, { cwd: rootPath })

  if (wcsc.status === 0) {
    let res = wcsc.stdout.toString();
    res = res.split('=')
    const funcList = {}
    for (let i = 0, len = res.length; i < len && res[i + 1]; i += 2) {
      funcList[res[i]] = res[i + 1].replace(
          /((\\x[\da-f]{2}|\\u[\da-f]{4})){1,}/gi,
          function ($0, $1, $2) {
              return eval('"' + $0 + '"');
          }
        ).replace(/\\[\s\S]{1}/gi, function ($0, $1, $2) {
          // console.log($0, $1)
          const c = $0 === "\\n" ? "\n" : $0[1];
          return c
      })
    }
    return funcList
  } else {
    return new Error(`编译 .wxss 文件错误：${wcsc.stderr.toString()}`)
  }
}

module.exports = wxssToJS
