const util = require('./util')
const path = require('path')
const fs = util.fs

let wcsc

function loadWcscAddon() {
  if (wcsc) return
  // wcsc = require('../build/Release/wcsc.node')
  wcsc = require('../src/wcsc')
}

function tranWcscResultToObject(resultStr) {
  const resultArr = resultStr.split('=')
  const result = {}
  for (let i = 0, len = resultArr.length; i < len && resultArr[i + 1]; i += 2) {
    result[resultArr[i]] = resultArr[i + 1]
  }
  return result
}

exports = async function (options) {
  
  loadWcscAddon()

  if (!options) throw Error('options is required')

  // avoid undefined or null
  if (typeof options.subPackage !== 'string') {
    delete options.subPackage
  }

  if (typeof options.lazyload !== 'boolean') {
    delete options.lazyload
  }

  options = Object.assign(
    {
      files: [],
      contents: [],
      pageCount: 0,
      cwd: process.cwd,
      replaceContent: {},
      debug: false,
      classPrefix: '',
      lazyload: false,
    },
    options,
  )

  if (!options.contents.length) {
    const tasks = options.files.map((file) => {
      if (typeof options.replaceContent[file] === 'string') {
        return options.replaceContent[file]
      }
      return fs.readFile(path.resolve(options.cwd, file), 'utf8')
    })
    options.contents = await Promise.all(tasks) || []
  }

  let wccResult
  try {
    wccResult = await wcsc(options)
  } catch (errmsg) {
    throw new Error(errmsg)
  }

  const result = options.lazyload ? wccResult : tranWcscResultToObject(wccResult)

  if (options.output) {
    const output = path.resolve(options.cwd, options.output)
    const dir = path.dirname(output)
    try {
      await fs.stat(dir)
    } catch (e) {
      await fs.mkdir(dir, {
        recursive: true,
      })
    }
    await fs.writeFile(output, JSON.stringify(result, null, 2), 'utf8')
  }

  return result
}

Object.defineProperty(exports, 'version', {
  get() {
    loadWcscAddon()
    return wcsc.version
  },
})

module.exports = exports
