
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