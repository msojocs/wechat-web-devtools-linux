#!/usr/bin/env node
// Linux-only entry adapter. Other platforms keep the original installer script.
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const name = path.basename(fileURLToPath(import.meta.url), '.mjs')
const argv = process.argv.slice(2)
const platformIndex = argv.indexOf('--platform')
const platform = platformIndex < 0 ? process.platform : argv[platformIndex + 1]

try {
  if (String(platform).toLowerCase() === 'linux') {
    const { runInstaller } = await import('./linux-installation.mjs')
    const result = runInstaller(name, argv)
    console.log(JSON.stringify(result, null, 2))
    if (name === 'ensure-cli-path' && !result.ok) process.exitCode = 1
  } else {
    await import(new URL(`./${name}.upstream.mjs`, import.meta.url))
  }
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
}
