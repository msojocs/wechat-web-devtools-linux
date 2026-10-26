
;/* patch wechat devtools begin */
// 由 tools/fix-skill.sh 追加到 wechatide-skill/skills/installer/scripts/install-root.mjs。
// skill 会被复制到 agent 的 skills 目录，可能随项目仓库同步到 macOS / Windows：
// 只在 Linux 上替换安装目录的查找逻辑，其它系统仍走官方实现。
if (process.platform === 'linux') {
  getInstallRoots = (platform, installRoot) => {
    if (installRoot) {
      return [installRoot]
    }
    const configDir = `${process.env.HOME}/.config/wechat-devtools/app`
    if (!fs.existsSync(configDir)) {
      console.warn('Wechat Devtools config directory does not exist:', configDir)
      return []
    }
    if (!fs.existsSync(`${configDir}/.install_path`)) {
      console.warn('Wechat Devtools install path file does not exist:', `${configDir}/.install_path`)
      return []
    }
    return [
      fs.readFileSync(`${configDir}/.install_path`, 'utf8').trim()
    ]
  }
  getWechatidePath = (platform, installRoot) => {
    return path.join(installRoot, 'bin', 'wechatide')
  }
  normalizePlatform = () => 'darwin'
  getPackagePaths = (platform, installRoot) =>{

    return {
      nw: path.join(installRoot, 'code', 'package.nw', 'package.json'),
      electron: path.join(installRoot, 'resources', 'app.asar.unpacked', 'package.json')
    }
  }
}
/* patch wechat devtools end */
