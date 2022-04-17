#!/bin/bash
# 参数：
# 1 ---- NW版本

set -e
root_dir=$(cd `dirname $0`/.. && pwd -P)
package_dir="$root_dir/package.nw"
export PATH="$root_dir/node/bin:$PATH"

if [ ! -z $1 ];then
  NW_VERSION=$1
fi
if [ -z $NW_VERSION ]; then
  echo "NW 版本未指定！"
  exit 1
fi

PY_VERSION=`python -V 2>&1|awk '{print $2}'|awk -F '.' '{print $1}'`
if [ $PY_VERSION != 2 ]; then
  hash python2 2>/dev/null || { echo >&2 "I require python2 but it's not installed.  Aborting."; exit 1; }
  ln -s "$( which python2 )" "$root_dir/node/bin/python"
fi

hash nw-gyp 2>/dev/null || {
  echo "=======请安装nw-gyp======="
  exit 1
}

# 代理处理
# echo "尝试取消所有代理"
# unset http_proxy
# unset HTTP_PROXY
# unset https_proxy
# unset HTTPS_PROXY
# unset socket_proxy
# unset SOCKET_PROXY
# unset all_proxy
# unset ALL_PROXY

echo -e "\033[42;37m ######## 版本信息 $(date '+%Y-%m-%d %H:%M:%S') ########\033[0m"
echo "NW VERSION: $NW_VERSION"
echo "nw-gyp version: $( nw-gyp --version )"
echo "node version: $(node --version )"
echo "npm version: $(npm --version )"
python --version
python3 --version

rm -fr "${package_dir}/node_modules/vscode-windows-ca-certs" # the module is only available in windows
rm -fr "${package_dir}/node_modules/vscode-windows-registry" # the module is only available in windows
rm -fr "${package_dir}/node_modules/vscode-windows-registry-node" # the module is only available in windows
rm -fr "${package_dir}/node_modules/windows-process-tree" # the module is only available in windows

rm -fr "${package_dir}/node_modules/vscode-ripgrep/bin" # redownload bin on linux

rm -fr "${package_dir}/node_modules/node-pty" "${package_dir}/node_modules/node-pty-node" # the native module is not available in windows

(cd "${package_dir}/node_modules" && find -name *.pdb | xargs -I{} rm -r {}) # remove pdb debugging file

rm -fr "${package_dir}/node_modules_tmp" # remove previous hacking tmp 
mkdir -p "${package_dir}/node_modules_tmp"
cp -fr "${package_dir}/node_modules" "${package_dir}/node_modules_tmp/node_modules" 

rm -fr "${package_dir}/node_modules_tmp/node_modules/node-pty"
rm -fr "${package_dir}/node_modules_tmp/node_modules/node-pty-node"
rm -fr "${package_dir}/node_modules_tmp/node_modules/native-watchdog"
rm -fr "${package_dir}/node_modules_tmp/node_modules/oniguruma-node"
rm -fr "${package_dir}/node_modules_tmp/node_modules/nodegit"
rm -fr "${package_dir}/node_modules_tmp/node_modules/vscode-ripgrep"
rm -fr "${package_dir}/node_modules_tmp/node_modules/spdlog"
rm -fr "${package_dir}/node_modules_tmp/node_modules/spdlog-node"

max_thread=$(cat /proc/cpuinfo| grep "processor"| wc -l)
export JOBS=$max_thread
(cd "${package_dir}/node_modules_tmp" && npm install \
    extract-file-icon \
    native-keymap \
    node-pty \
    native-watchdog \
    oniguruma \
    spdlog@0.11.1 \
    trash \
    vscode-oniguruma \
    @vscode/ripgrep \
    nodegit \
    --registry=https://registry.npmmirror.com \
    --nodegit_binary_host_mirror=https://npmmirror.com/mirrors/nodegit/v0.27.0/ ) # reinstall modules

# rebuild
cd "$package_dir/node_modules_tmp/node_modules/node-pty" && nw-gyp rebuild --arch=x64 "--target=$NW_VERSION" --dist-url=https://registry.npmmirror.com/-/binary/nwjs
(cp -fr "${package_dir}/node_modules_tmp/node_modules/node-pty" "${package_dir}/node_modules_tmp/node_modules/node-pty-node")
rm -rf "${package_dir}/node_modules/node-pty" "${package_dir}/node_modules/node-pty-node"
cp -fr "${package_dir}/node_modules_tmp/node_modules/node-pty" "${package_dir}/node_modules"
(cp -fr "${package_dir}/node_modules/node-pty" "${package_dir}/node_modules/node-pty-node")

cd "$package_dir/node_modules_tmp/node_modules/native-watchdog" && nw-gyp rebuild --arch=x64 "--target=$NW_VERSION" --dist-url=https://registry.npmmirror.com/-/binary/nwjs
rm -rf "${package_dir}/node_modules/native-watchdog" && cp -fr "${package_dir}/node_modules_tmp/node_modules/native-watchdog" "${package_dir}/node_modules"

cd "${package_dir}/node_modules_tmp/node_modules/nodegit" && rm -rf .github include src lifecycleScripts vendor utils build/vendor build/Release/.deps
cp -fr "${package_dir}/node_modules_tmp/node_modules/nodegit" "${package_dir}/node_modules"

(cp -fr "${package_dir}/node_modules_tmp/node_modules/oniguruma" "${package_dir}/node_modules_tmp/node_modules/oniguruma-node")
(cp -fr "${package_dir}/node_modules_tmp/node_modules/spdlog" "${package_dir}/node_modules_tmp/node_modules/spdlog-node")
cd "$package_dir/node_modules_tmp/node_modules/spdlog" && nw-gyp rebuild --arch=x64 "--target=$NW_VERSION" --dist-url=https://registry.npmmirror.com/-/binary/nwjs

(cd "${package_dir}/node_modules_tmp/node_modules" && find -name ".deps" | xargs -I{} rm -rf {} && find -name "obj.target" | xargs -I{} rm -rf {} && find -name "*.a" -delete && find -name "*.lib" -delete && find -name "*.mk" -delete)
(cd "${package_dir}/node_modules_tmp/node_modules" && find -name "*.node" | xargs -I{} \cp -rf {} ${package_dir}/node_modules/{})

cd "${package_dir}/node_modules_tmp/node_modules/@vscode/ripgrep" && \
sed -i 's/api.github.com/wechat-devtools.jiyecafe.workers.dev/' lib/download.js && \
sed -i "s/ const release/ downloadOpts.headers.upstream = 'api.github.com';const release/" lib/download.js && \
sed -i "s/ return download/ opts.headers.upstream = 'objects.githubusercontent.com';return download/" lib/download.js && \
sed -i 's/response.headers.location,/response.headers.location.replace("objects.githubusercontent.com", "wechat-devtools.jiyecafe.workers.dev"),/' lib/download.js && \
npm run postinstall
mkdir -p "${package_dir}/node_modules/vscode-ripgrep/bin"
\cp -fr "${package_dir}/node_modules_tmp/node_modules/@vscode/ripgrep/bin/rg" "${package_dir}/node_modules/vscode-ripgrep/bin/rg"

(cd "${package_dir}/node_modules" && find -name ".deps" | xargs -I{} rm -rf {} && find -name "obj.target" | xargs -I{} rm -rf {} && find -name "*.a" -delete && find -name "*.lib" -delete && find -name "*.mk" -delete && find -name "*Makefile" -delete && find -name "*gyp*" -delete)
rm -rf "${package_dir}/node_modules_tmp"
