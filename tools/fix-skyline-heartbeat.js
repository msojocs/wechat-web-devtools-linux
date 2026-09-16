const fs = require('node:fs')
const path = require('node:path')

// This component owns the simulator heartbeat timer. A lost Wine connection
// already reports SIMULATOR_LAUNCH_ERROR; it must also stop the timer instead
// of treating ten rejected RPCs as a busy/infinite-looping appservice.
function patchHeartbeat(source) {
    const marker = '/* skyline-disconnect-heartbeat */'
    if (source.includes(marker)) return source
    let matches = 0
    const patched = source.replace(
        /(\w+)\.current=setInterval\(\(\)=>\{[^;]*?\.heartBeat\(\)\.then\(\(\)=>\{\w+=0\}\)/g,
        (match, timer) => {
            matches++
            return match + `.catch(error=>{${marker}if(/not connected|peer disconnected|closed connection|connection (?:refused|reset|aborted)|broken pipe/i.test(error?.message||String(error)))clearInterval(${timer}.current);else console.error("appservice heartbeat failed",error)})`
        },
    )
    if (matches !== 1) throw new Error(`Expected one appservice heartbeat timer, found ${matches}`)
    return patched
}

if (require.main === module) {
    const appDir = process.argv[2] || path.join(__dirname, '../resources/app')
    const filename = path.join(appDir, 'js/2351135f2e4d1c1e2dada7b48055e240.js')
    const source = fs.readFileSync(filename, 'utf8')
    fs.writeFileSync(filename, patchHeartbeat(source))
}

module.exports = { patchHeartbeat }
