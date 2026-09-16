// This module is copied beside the untouched upstream install-root.mjs.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import {
  compareVersions, getPackagePaths, MIN_COMPATIBLE_VERSION, resolveWechatideFromPath,
} from './install-root.mjs'

function parseArgs(name, argv) {
  const options = { installRoot: '', check: false }
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index]
    if (arg === '--check' && name === 'ensure-cli-path') {
      options.check = true
      continue
    }
    if (!['--platform', '--install-root'].includes(arg)) throw new Error(`未知参数：${arg}`)
    const value = argv[++index]
    if (!value || value.startsWith('--')) throw new Error(`参数 ${arg} 缺少值`)
    if (arg === '--platform' && value.toLowerCase() !== 'linux') throw new Error(`不支持的系统：${value}`)
    if (arg === '--install-root') options.installRoot = path.resolve(value)
  }
  return options
}

function samePath(left, right) {
  if (!left || !right) return false
  try { return fs.realpathSync(left) === fs.realpathSync(right) } catch { return false }
}

function resolveInstallation(installRoot) {
  const command = resolveWechatideFromPath()
  if (!installRoot && command) installRoot = path.resolve(path.dirname(fs.realpathSync(command)), '..')
  // Accept both the source-build root and its electron/ runtime directory.
  if (installRoot && path.basename(installRoot) === 'electron'
      && fs.existsSync(path.join(installRoot, '../bin/wechatide'))) {
    installRoot = path.dirname(installRoot)
  }
  const checkedInstallRoots = installRoot ? [installRoot] : []
  const root = installRoot && fs.existsSync(installRoot) ? installRoot : null
  const targetPath = root ? path.join(root, 'bin/wechatide') : null
  return { root, targetPath, command, checkedInstallRoots }
}

function checkInstallation(install) {
  if (!install.root) return { compatible: false, reason: 'not_installed' }
  const paths = getPackagePaths('linux', install.root)
  const incompatible = (reason, extra = {}) => ({ compatible: false, mustEnterInstaller: true, reason, ...extra })
  if (fs.existsSync(paths.nw)) return incompatible('nw_runtime_incompatible')
  if (!fs.existsSync(paths.electron)) return incompatible('unknown_runtime_incompatible')
  let version
  try {
    version = JSON.parse(fs.readFileSync(paths.electron, 'utf8')).version
    if (typeof version !== 'string' || !version.trim()) throw new Error(`package.json 缺少 version：${paths.electron}`)
    version = version.trim()
    if (compareVersions(version, MIN_COMPATIBLE_VERSION) < 0) {
      return incompatible('electron_version_too_old', { version })
    }
  } catch (error) {
    return incompatible('electron_version_unreadable', { error: error.message })
  }
  let error
  // An explicit installation must not be validated by an unrelated PATH command.
  const candidates = samePath(install.command, install.targetPath)
    ? [install.command, install.targetPath] : [install.targetPath]
  for (const command of new Set(candidates.filter(candidate => candidate && fs.existsSync(candidate)))) {
    const result = spawnSync(command, ['-h'], { encoding: 'utf8', timeout: 10_000 })
    if (!result.error && result.status === 0) return { compatible: true, version, command }
    error = result.error?.message || (result.stderr || result.stdout || `exit ${result.status}`).trim()
  }
  if (!fs.existsSync(install.targetPath)) return incompatible('wechatide_missing', { version })
  return incompatible('cli_unavailable', { version, command: install.targetPath, error })
}

function ensureCliPath(install, check) {
  const { root, targetPath, command, checkedInstallRoots } = install
  if (!root) return { ok: false, action: 'not_installed', error: '未找到微信开发者工具安装目录', checkedInstallRoots }
  if (!fs.existsSync(targetPath)) {
    return { ok: false, action: 'wechatide_missing', installRoot: root, targetPath, error: '安装目录存在，但缺少 wechatide 入口' }
  }
  if (samePath(command, targetPath)) {
    return { ok: true, action: 'already_linked', command, linkPath: command, targetPath, commandReady: true }
  }
  if (check) {
    return { ok: false, action: 'needs_link', targetPath, pathCommand: command || undefined, commandReady: false,
      hint: '运行本脚本（去掉 --check）可创建软链' }
  }
  const binDir = path.join(os.homedir(), '.local/bin')
  const linkPath = path.join(binDir, 'wechatide')
  let existing
  try { existing = fs.lstatSync(linkPath) } catch (error) { if (error.code !== 'ENOENT') throw error }
  if (existing && !samePath(linkPath, targetPath)) {
    return { ok: false, action: 'failed', targetPath, linkPath, commandReady: false,
      error: `${linkPath} 已存在且指向其他文件，请先手动处理` }
  }
  fs.mkdirSync(binDir, { recursive: true })
  if (!existing) fs.symlinkSync(targetPath, linkPath)
  const commandReady = samePath(resolveWechatideFromPath(), targetPath)
  return { ok: true, action: existing ? 'already_linked' : 'linked', command: 'wechatide',
    linkPath, targetPath, binDir, pathUpdated: false, commandReady,
    pathHint: commandReady ? undefined : `请将 ${binDir} 加入 PATH；当前可直接使用 ${targetPath}` }
}

export function runInstaller(name, argv) {
  const options = parseArgs(name, argv)
  const install = resolveInstallation(options.installRoot)
  if (name === 'check-installation') return checkInstallation(install)
  if (name === 'ensure-cli-path') return ensureCliPath(install, options.check)
  throw new Error(`未知安装入口：${name}`)
}
