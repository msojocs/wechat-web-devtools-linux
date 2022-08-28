#!/usr/bin/env node
// Extract core.wxvpkg of current folder to dest folder
/**
 * 使用：
 * 两个参数
 * uppack.js from to
 * from: pkg文件
 * to: 目标文件夹
 */
const path = require('path')
const fs = require('fs')

const args = process.argv.slice(2);
const from = args[0]
const to = args[1]

let dest = to
fs.mkdirSync(dest, {recursive: true})
let file = from
let fd = fs.openSync(file, 'r')

// read buffer
function readSync(start, length) {
  const n = Buffer.alloc(length);
  fs.readSync(fd, n, 0, length, start)
  return n
}

const totalCount = readSync(14, 4).readInt32BE(0)
console.log('totalCount', totalCount)
const map = {};
let n = 18;
for (let i = 0; i < totalCount; i++) {
  const e = {};
  // byte length of filename
  const i = readSync(n, 4).readInt32BE(0);
  n += 4;
  e.name = readSync(n, i).toString();
  n += i;
  e.offset = readSync(n, 4).readInt32BE(0);
  n += 4;
  e.length = readSync(n, 4).readInt32BE(0);
  n += 4;
  map[e.name] = e
}

let created = []
for (let item of Object.values(map)) {
  let dir = path.join(dest, path.dirname(item.name))
  if (created.indexOf(dir) == -1) {
    fs.mkdirSync(dir, {recursive: true})
    created.push(dir)
  }
  let buf = readSync(item.offset, item.length)
  let filepath = path.join(dest, item.name)
  fs.writeFileSync(filepath, buf.toString('utf8'), 'utf8')
}

fs.closeSync(fd)