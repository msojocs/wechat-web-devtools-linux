const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

const begin = '/* skyline-touch-lifecycle begin */'
const end = '/* skyline-touch-lifecycle end */'

function patchTouchLifecycle(source) {
    const start = source.indexOf(begin)
    const finish = source.indexOf(end)
    if (start !== -1 || finish !== -1) {
        if (start === -1 || finish < start || source.indexOf(begin, start + begin.length) !== -1 ||
            source.indexOf(end, finish + end.length) !== -1) {
            throw new Error('Invalid Skyline touch lifecycle patch markers')
        }
        source = source.slice(0, start) + source.slice(finish + end.length)
    }
    if ((source.match(/window\.SkylineRenderer\s*=\s*[$\w]+/g) || []).length !== 1 ||
        !source.includes('installEventListener(') || !source.includes('dispatchEvent(')) {
        throw new Error('Expected one SkylineRenderer with input methods')
    }
    const patch = fs.readFileSync(path.join(__dirname, '../res/scripts/skyline-touch.js'), 'utf8').trim()
    // Keep the upstream sourceURL last and run after the renderer class exists,
    // before the host can construct it in response to pageframe readiness.
    const sourceURL = source.lastIndexOf('//# sourceURL=')
    const code = (sourceURL === -1 ? source : source.slice(0, sourceURL)).trimEnd()
    const trailer = sourceURL === -1 ? '' : '\n' + source.slice(sourceURL).trimEnd()
    const result = `${code}\n${begin}\n${patch}\n${end}${trailer}\n`
    new vm.Script(result, { filename: 'skyline/index.js' })
    return result
}

if (require.main === module) {
    const appDir = process.argv[2] || path.join(__dirname, '../resources/app')
    const filename = path.join(appDir, 'js/extensions/skyline/index.js')
    const source = fs.readFileSync(filename, 'utf8')
    const patched = patchTouchLifecycle(source)
    if (patched !== source) fs.writeFileSync(filename, patched)
}

module.exports = { patchTouchLifecycle }
