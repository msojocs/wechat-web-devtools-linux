const path = require('path')
const vm = require('vm')
const glob = require('glob')
const unescapeJs = require('unescape-js')

const wcc = require('./wcc')

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
    const compileResult = wcc(rootPath, files.map(file => file.substring(0, file.length - 5)), wxsFiles)

    return `
      ${compileResult};
      return $gwx;
    `
  },
}
