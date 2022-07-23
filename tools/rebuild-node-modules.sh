#!/bin/bash
# 参数：
# 1 ---- NW版本

set -e

notice() {
    echo -e "\033[36m $1 \033[0m "
}

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

echo -e "\033[42;37m ######## 版本信息 $(date '+%Y-%m-%d %H:%M:%S') ########\033[0m"
echo "NW VERSION: $NW_VERSION"
echo "nw-gyp version: $( nw-gyp --version )"
echo "node version: $(node --version )"
echo "npm version: $(npm --version )"
python --version
python3 --version

# these modules are only available in windows
cd "${package_dir}/node_modules" && \
rm -fr "vscode-windows-ca-certs" "vscode-windows-registry" "vscode-windows-registry-node" "windows-process-tree"

rm -fr "${package_dir}/node_modules/vscode-ripgrep/bin/"* # redownload bin on linux
# https://github.com/microsoft/ripgrep-prebuilt
cd "${package_dir}/node_modules/vscode-ripgrep" && \
mkdir -p tmp && cd tmp

# if [ "$ACTION_MODE" != "true" ]; then
#     notice "非ACTION模式, 设置镜像源"
#     export https_proxy="http://127.0.0.1:7890"
# fi
wget https://github.com/microsoft/ripgrep-prebuilt/releases/download/v12.1.1-1/ripgrep-v12.1.1-1-x86_64-unknown-linux-musl.tar.gz -O ripgrep-v12.1.1-1-x86_64-unknown-linux-musl.tar.gz
tar xvf ripgrep-v12.1.1-1-x86_64-unknown-linux-musl.tar.gz -C ../bin && \
cd .. && rm -rf tmp

(cd "${package_dir}/node_modules" && \
find -name *.pdb | xargs -I{} rm -rf {} && \
find -name *.lib | xargs -I{} rm -rf {} && \
# find -name *.exe | xargs -I{} rm -rf {} && \
find -name *.dll | xargs -I{} rm -rf {}) # remove pdb debugging file

rm -fr "${package_dir}/node_modules_tmp" # remove previous hacking tmp 
mkdir -p "${package_dir}/node_modules_tmp/node_modules"

notice "install modules"
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
    nodegit \
    --registry=https://registry.npmmirror.com \
    --nodegit_binary_host_mirror=https://npmmirror.com/mirrors/nodegit/v0.27.0/ ) # reinstall modules

# rebuild
notice "rebuild node-pty"
cd "$package_dir/node_modules_tmp/node_modules" && \
cp -fr "node-pty" "node-pty-node" && \
cd "node-pty" && nw-gyp rebuild --arch=x64 "--target=$NW_VERSION" --dist-url=https://registry.npmmirror.com/-/binary/nwjs

notice "rebuild native-watchdog"
cd "$package_dir/node_modules_tmp/node_modules/native-watchdog" && \
nw-gyp rebuild --arch=x64 "--target=$NW_VERSION" --dist-url=https://registry.npmmirror.com/-/binary/nwjs

cd "${package_dir}/node_modules_tmp/node_modules/nodegit" && rm -rf .github include src lifecycleScripts vendor utils build/vendor build/Release/.deps
cp -fr "${package_dir}/node_modules_tmp/node_modules/nodegit" "${package_dir}/node_modules"

notice "rebuild oniguruma"
cd "${package_dir}/node_modules_tmp/node_modules" && \
cp -fr "oniguruma" "oniguruma-node" && \
cd "oniguruma" && nw-gyp rebuild --arch=x64 "--target=$NW_VERSION" --dist-url=https://registry.npmmirror.com/-/binary/nwjs

notice "rebuild spdlog"
cd "${package_dir}/node_modules_tmp/node_modules" && \
cp -fr "spdlog" "spdlog-node" && \
cd "spdlog" && nw-gyp rebuild --arch=x64 "--target=$NW_VERSION" --dist-url=https://registry.npmmirror.com/-/binary/nwjs

notice "remove unused files"
(cd "${package_dir}/node_modules_tmp/node_modules" && \
find -name ".deps" | xargs -I{} rm -rf {} && \
find -name "obj.target" | xargs -I{} rm -rf {} && \
find -name "*.a" -delete && \
find -name "*.lib" -delete && \
find -name "*.mk" -delete)

notice "copy node files"
(cd "${package_dir}/node_modules_tmp/node_modules" && \
find -name "*.node" | xargs -I{} \cp -rf {} ${package_dir}/node_modules/{})

rm -rf "${package_dir}/node_modules_tmp"
