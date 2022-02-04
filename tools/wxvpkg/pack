#!/usr/bin/env node

// https://gist.github.com/chemzqm/9f2334ca201dc2fbc363fdd757aa2ed4
const path = require('path')
const fs = require('fs')
const { execSync } = require('child_process')

const args = process.argv.slice(2);
const from = args[0]
const to = args[1]

let file = to
console.log(file)
if (fs.existsSync(file)) {
  execSync(`rm -rf ${file}`)
}

let fd = fs.openSync(file, 'w')
let dest = from

function writeSync(buf, start) {
  fs.writeSync(fd, buf, 0, buf.length, start)
}

function writeInt32(number, start) {
  let buf = Buffer.alloc(4)
  buf.writeInt32BE(number, 0)
  writeSync(buf, start)
}

let files = fs.readdirSync(dest)
let totalCount = files.length
let buf = Buffer.alloc(4)
buf.writeInt32BE(totalCount, 0)
writeSync(buf, 14)
let start = 18
// 12 + /name.length
let dataOffset = start
for (let file of files) {
  let name = `/${file}`
  let buf = Buffer.from(name, 'utf8')
  dataOffset = dataOffset + 12 + buf.length
}

for (let file of files) {
  let nb = Buffer.from(`/${file}`, 'utf8')
  // write filename byte length
  writeInt32(nb.length, start)
  start += 4
  // write filename
  writeSync(nb, start)
  start += nb.length
  // write offset
  writeInt32(dataOffset, start)
  start += 4
  // write length
  let contentBuf = fs.readFileSync(path.join(dest, file))
  writeInt32(contentBuf.length, start)
  start += 4
  // write content
  writeSync(contentBuf, dataOffset)
  dataOffset += contentBuf.length
}

fs.closeSync(fd)