const util = require('./util')
const path = require('path')

let wcc
try {
  console.warn('wcc load')
  wcc = require('./src/wcc')
} catch (err) {
  console.error('wcc', err)
  // wcc = require('./build/Release/wcc.node')
}

const fs = util.fs

exports = async function (options) {
  // console.warn('wcc init options:', options);
  if (!options) throw Error('options is required')

  const lazyload = !!options.lazyloadConfig

  options = Object.assign(
    {
      files: [],  // FILES
      contents: [],
      replaceContent: {},
      verbose: false,
      debug: false,   // -d
      debugWXS: false,   // -ds
      showNewTree: false,
      isPlugin: false,
      addTestAttre: false,
      independent: false,
      genfuncname: '$gwx',   // -gn
      isCut: false,         // --split
      cwd: process.cwd,
      debug: false,
      lazyload,               // -ll
      lazyloadConfig: '',
    },
    options,
  )

  return new Promise(async (resolve, reject) => {
    let st = Date.now()

    // 获取文件内容
    if (!options.contents.length) {
      const tasks = options.files.map((file) => {
        if (typeof options.replaceContent[file] === 'string') {
          return options.replaceContent[file]
        }
        return fs.readFile(path.resolve(options.cwd, file), 'utf8')
      })
      options.contents = await Promise.all(tasks) || []
    }
    // console.warn('wcc get files', Date.now() - st, options.contents)
    let result
    try {
      // console.warn('final options:', options);
      result = wcc(options.cwd, options.files, {cut: options.isCut}, options)
      // console.warn('wcc result', result)
    } catch(errmsg) {
      reject(new Error(errmsg))
      return
    }

    // console.log('wcc get compile', Date.now() - st)
    if (options.output) {
      const output = path.resolve(options.cwd, options.output)
      const dir = path.dirname(output)
      if (lazyload) {
        // lazyload 为 true时，wcc 返回值是个对象, 需要序列化一下
        // result = JSON.stringify(result)
      }
      try {
        await fs.stat(dir)
      } catch (e) {
        await fs.mkdir(dir, {
          recursive: true,
        })
      }
      await fs.writeFile(output, result, 'utf8')
    }
    console.warn('wcc get output', Date.now() - st)
    resolve(result)
  })
}

Object.defineProperty(exports, 'version', {
  get() {
    return wcc.version
  },
})

module.exports = exports
