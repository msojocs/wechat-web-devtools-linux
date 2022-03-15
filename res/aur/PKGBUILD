# Maintainer: msojocs <jiyecafe@gmail.com>
# Contributor: ccat3z <c0ldcat3z@gmail.com>
# Contributor: bruceutut <zttt183525594@gmail.com>

# 方法参考
# https://github.com/msojocs/wechat-web-devtools-linux
# https://github.com/dragonation/wechat-devtools
# https://github.com/cytle/wechat_web_devtools

_wechat_devtools_ver="1.05.2203070"
# https://servicewechat.com/wxa-dev-logic/download_redirect?type=x64&from=mpwiki&download_version=1052203030&version_type=1
_wechat_devtools_url="https://servicewechat.com/wxa-dev-logic/download_redirect?type=x64&from=mpwiki&download_version=${_wechat_devtools_ver//\./}&version_type=1"
# _wechat_devtools_url="https://dldir1.qq.com/WechatWebDev/release/p-ae42ee2cde4d42ee80ac60b35f183a99/wechat_devtools_1.05.2201240_x64.exe"
_wechat_devtools_md5="2785d569b88d72a8e238d438d92faf44"

_wechat_devtools_exe="wechat_devtools_${_wechat_devtools_ver}_x64.exe"
_nwjs_ver="0.53.1"
_install_dir="/opt/wechat-devtools"
_node_version="16.1.0"

pkgname=wechat-devtools
pkgver="${_wechat_devtools_ver}"  # 主版本号
pkgrel=3   # 修订版本号release
epoch=2    # 大版本迭代强制更新（维护者变更，尽量不用）
pkgdesc="WeChat Devtools For Linux. "
arch=("x86_64")
url="https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html"
license=('unknown')
depends=('gconf' 'libxkbfile')
makedepends=('p7zip' 'python2' 'openssl' 'gcc' 'make' 'libssh2' 'krb5')
# compiler 用于可视化,以及编译
source=("nwjs-v${_nwjs_ver}.tar.gz::https://npm.taobao.org/mirrors/nwjs/v${_nwjs_ver}/nwjs-sdk-v${_nwjs_ver}-linux-x64.tar.gz"
        "${_wechat_devtools_exe}::${_wechat_devtools_url}"
        "node-v${_node_version}.tar.gz::https://npm.taobao.org/mirrors/node/v${_node_version}/node-v${_node_version}-linux-x64.tar.gz"
        "compiler.tar.gz::https://github.rc1844.workers.dev/msojocs/wechat-web-devtools-linux/releases/download/v1.05.2203070-3/compiler.tar.gz"
        "wechat-devtools.desktop"
        "logo.svg"
        "fix-cli.sh"
        "fix-menu.sh"
        "fix-core.sh"
        "rebuild-node-modules.sh"
        "fix-package-name.js"
        "wxvpkg_pack.js"
        "wxvpkg_unpack.js"
        "fix-other.sh")
md5sums=(b6f49803c51d0abacca2d1e566c7fe19   # nwjs
         "${_wechat_devtools_md5}"
         2280bfbbf29981fd5adce334f40146ff   # nodejs
         9650f811d5c4d2ca124dcfa6d0b32c4c   # compiler
         01ea705bfe43f5f9683f0dbefb3f1574   # desktop
         0f4353664123320280ea4d6bb295dce2   # svg
         "SKIP"
         "SKIP"
         "SKIP"
         "SKIP"
         "SKIP"
         "SKIP"
         "SKIP"
         "SKIP")
options=('!strip')

prepare() {
    7z x -owechat_devtools ${_wechat_devtools_exe} code/package.nw
    mv wechat_devtools/code/package.nw package.nw
    rm -rf wechat_devtools
    ls | grep node-*linux* | xargs -I{} mv {} node
    ls | grep nwjs-*linux* | xargs -I{} mv {} nwjs

    mkdir -p tools
    for file in *.js *.sh; do
        mv $file tools;
    done
}

_log() {
    echo -e "\e[1;34m$@\e[0m"
}

build() {
    # prepare node
    _log "prepare node v${_node_version}"
    export PATH="$srcdir/node/bin:$PATH"

    # prepare nw-gyp
    _log "prepare nw-gyp"
    npm uninstall node-gyp -g
    npm install nw-gyp node-gyp -g

    # node bin
    _log "copy node exectuable"
    cp "$(which node)" "${srcdir}/node.${_node_version}"

    # run fix scripts
    export NW_PACKAGE_DIR="${srcdir}/package.nw"
    export NW_VERSION=$_nwjs_ver
    export srcdir=$srcdir
    export NO_WINE=true
    
    for script in fix-package-name.js fix-cli.sh fix-other.sh fix-menu.sh fix-core.sh rebuild-node-modules.sh; do
        _log "run ${script}"
        "${srcdir}/tools/${script}"
    done

    # cleanup
    _log "done"
}

package() {
    mkdir -p "${pkgdir}${_install_dir}"
    cd "${pkgdir}${_install_dir}"

    cp -r "${srcdir}/nwjs/"* ./
    cp -r "${srcdir}/package.nw" ./package.nw
    find ./package.nw -type d | xargs -I {} chmod -R a+rx {}

    cp ${srcdir}/node.${_node_version} node
    ln -s node node.exe

    install -Dm644 "${srcdir}/wechat-devtools.desktop" "${pkgdir}/usr/share/applications/wechat-devtools.desktop"
    install -Dm644 "${srcdir}/logo.svg" "${pkgdir}/usr/share/icons/hicolor/scalable/apps/wechat-devtools.svg"
}
