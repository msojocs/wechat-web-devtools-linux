const path = require('path')
const vm = require('vm')
const glob = require('glob')
const unescapeJs = require('unescape-js')

const wcc = require('./wcc')
const wcsc = require('./wcsc')

module.exports = {
  wxmlToJs(rootPath) {
    // wcc 编译器需要完整的 wxml 文件列表
    const files = glob.sync('**/*.wxml', {
      cwd: rootPath,
      nodir: true,
      dot: true,
      ignore: ['node_modules/**/*.wxml'],
    })
    const wxsFiles = glob.sync('**/*.wxs', {
      cwd: rootPath,
      nodir: true,
      dot: true,
      ignore: ['node_modules/**/*.wxs'],
    })
    const compileResult = wcc(rootPath, files.map(file => file.substr(0, file.length - 5)), wxsFiles)

    return `
      ${compileResult};
      return $gwx;
    `
  },

  wxssToJs(rootPath) {
    // wcsc 编译器需要完整的 wxss 文件列表
    const files = glob.sync('**/*.wxss', {
      cwd: rootPath,
      nodir: true,
      dot: true,
      ignore: ['node_modules/**/*.wxss'],
    })
    const compileResult = wcsc(rootPath, files.map(file => file.substr(0, file.length - 5)))

    // 拼装 wxss map 字符串
    let wxssMap = ''
    Object.keys(compileResult).forEach(key => {
      if (path.extname(key) === '.wxss') {
        wxssMap += `'${key}': ${unescapeJs(compileResult[key])},`
      }
    })

    return `
      ${unescapeJs(compileResult.comm)};
      var wxssMap = { ${wxssMap} };
      return function (filePath) {
        return wxssMap[filePath];
      };
    `
  },
}
