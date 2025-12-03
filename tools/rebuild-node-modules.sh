#!/bin/bash
# 参数：
# 1 ---- NW版本

set -ex

notice() {
    echo -e "\033[36m $1 \033[0m "
}

fail() {
    echo -e "\033[41;37m 失败 \033[0m $1"
}

root_dir=$(cd `dirname $0`/.. && pwd -P)
package_dir="$root_dir/package.nw"

if [ ! -z $1 ];then
  NW_VERSION=$1
fi
if [ -z $NW_VERSION ]; then
  echo "NW 版本未指定！"
  exit 1
fi

PY_VERSION=`python -V 2>&1|awk '{print $2}'|awk -F '.' '{print $1}'`
# TODO: 兼容python2.7的命令
if [ $PY_VERSION != 2 ]; then
  hash python2.7 2>/dev/null || hash python2 2>/dev/null || { fail "I require python2 but it's not installed.  Aborting."; exit 1; }
  if hash python2.7 2>/dev/null; then
    ln -s "$( which python2.7 )" "$root_dir/node/bin/python"
  else
    ln -s "$( which python2 )" "$root_dir/node/bin/python"
  fi
fi

hash nw-gyp 2>/dev/null || {
  echo "=======请安装nw-gyp======="
  exit 1
}

arch=$(node "$root_dir/tools/parse-config.js" --get-arch $@)

if [ "$arch" == "loong64" ];then
  notice "龙架构，准备交叉编译"
  export PATH="$root_dir/cache/cross-tools/target/usr/bin:$root_dir/cache/cross-tools/loongarch64-unknown-linux-gnu/bin:$root_dir/cache/cross-tools/bin:$PATH"
  tools/cross-loong64-prepare.sh
  export CC=loongarch64-unknown-linux-gnu-gcc
  export CXX=loongarch64-unknown-linux-gnu-g++
  export AR=loongarch64-unknown-linux-gnu-ar
  export LINK=loongarch64-unknown-linux-gnu-g++
  export RANLIB=loongarch64-unknown-linux-gnu-ranlib
  export CFLAGS="-I$root_dir/cache/cross-tools/target/usr/include -I$root_dir/cache/cross-tools/target/usr/include/loongarch64-linux-gnu"
  export CXXFLAGS="-I$root_dir/cache/cross-tools/target/usr/include -I$root_dir/cache/cross-tools/target/usr/include/loongarch64-linux-gnu" # -fpermissive
  export LDFLAGS="-L$root_dir/cache/cross-tools/target/usr/lib64 -L$root_dir/cache/cross-tools/target/usr/lib/loongarch64-linux-gnu"

  # sed -i 's#-m64##' /home/user/.node-gyp/16.11.0/include/node/common.gypi
  # sed -i 's#-pthread##' /home/user/.node-gyp/16.11.0/include/node/common.gypi
  # sed -i 's#-rdynamic##' /home/user/.node-gyp/16.11.0/include/node/common.gypi
fi

echo -e "\033[42;37m ######## 版本信息 $(date '+%Y-%m-%d %H:%M:%S') ########\033[0m"
echo "NW VERSION: $NW_VERSION"
echo "nw-gyp version: $( nw-gyp --version )"
echo "node version: $(node --version )"
echo "npm version: $(npm --version )"
python --version
python3 --version

# these modules are only available in windows
cd "${package_dir}/node_modules" && \
rm -fr "vscode-windows-ca-certs" \
"vscode-windows-registry" "vscode-windows-registry-node" "windows-process-tree" \
"node-pty" "node-pty-node"

rm -fr "${package_dir}/node_modules/vscode-ripgrep/bin/"* # redownload bin on linux
# https://github.com/microsoft/ripgrep-prebuilt
cd "${package_dir}/node_modules/vscode-ripgrep" && \
mkdir -p tmp && cd tmp

# if [ "$ACTION_MODE" != "true" ]; then
#     notice "非ACTION模式, 设置镜像源"
#     export https_proxy="http://127.0.0.1:7890"
# fi

# ripgrep版本
ripgrep_version="12.1.1-1"
# ripgrep路径
ripgrep_path="$root_dir/cache/ripgrep-v${ripgrep_version}-x86_64-unknown-linux-musl.tar.gz"
mkdir -p "$root_dir/cache"
# 文件不存在，下载
if [ ! -f "$ripgrep_path" ];then
  wget https://github.com/microsoft/ripgrep-prebuilt/releases/download/v12.1.1-1/ripgrep-v12.1.1-1-x86_64-unknown-linux-musl.tar.gz \
  -O "${ripgrep_path}.tmp"
  mv "${ripgrep_path}.tmp" "${ripgrep_path}"
fi
tar xvf "$ripgrep_path" -C ../bin && \
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
    node-pty@1.0.0 \
    native-watchdog \
    oniguruma \
    spdlog@0.11.1 \
    nodegit \
    @vscode/sqlite3 \
    --ignore-scripts \
    --registry=https://registry.npmmirror.com \
    --nodegit_binary_host_mirror=https://npmmirror.com/mirrors/nodegit/v0.27.0/ ) # reinstall modules

# 每个模块单独 rebuild，因为交叉编译时可能需要单独调整配置
cd "${package_dir}/node_modules_tmp/node_modules"

node_version=$(node $root_dir/tools/parse-config.js --get-node-version $@)
configure_args="--target_platform=linux --target_arch=${arch} --verbose --host --target=v$node_version"

cd nodegit
notice "Build nodegit"
node-gyp configure "$configure_args"
if [ "$arch" == "loong64" ];then
  sed -i 's#libssh2ConfigureScript,#`${libssh2ConfigureScript} --host=loongarch64-unknown-linux-gnu`,#' utils/configureLibssh2.js
fi
node-gyp build
rm -rf .github include src lifecycleScripts vendor utils build/vendor build/Release/.deps
cd ..

cd extract-file-icon
node-gyp configure "$configure_args"
node-gyp build
cd ..

cd native-keymap
node-gyp configure "$configure_args"
node-gyp build
cd ..

cd node-pty
# node build
node-gyp configure "$configure_args"
node-gyp build
cd ..
# nw rebuild
notice "rebuild node-pty"
cp -fr "node-pty" "node-pty-node"
cd "node-pty"
nw-gyp rebuild --arch=$arch "--target=$NW_VERSION" --dist-url=https://registry.npmmirror.com/-/binary/nwjs
mkdir -p "$package_dir/node_modules/node-pty/build/Release"
cp -rf lib "$package_dir/node_modules/node-pty/lib"
cp -rf package.json "$package_dir/node_modules/node-pty/package.json"
# TODO: 此处似乎有问题，node用的也是nw的？
cp -rf "$package_dir/node_modules/node-pty" "$package_dir/node_modules/node-pty-node"
cd ..

cd native-watchdog
# 不需要node的版本
notice "build native-watchdog"
nw-gyp rebuild --arch=$arch "--target=$NW_VERSION" --dist-url=https://registry.npmmirror.com/-/binary/nwjs
cd ..

cp -fr "oniguruma" "oniguruma-node"
cd oniguruma-node
if [ "$arch" == "loong64" ];then
  BAK_CFLAGS="$CFLAGS"
  BAK_CXXFLAGS="$CXXFLAGS"
  export CFLAGS="$CFLAGS -x c -std=gnu89 -Wno-error=incompatible-pointer-types -Wno-incompatible-pointer-types"
  export CXXFLAGS="$CXXFLAGS -Wno-error=incompatible-pointer-types -Wno-incompatible-pointer-types"
fi
node-gyp configure "$configure_args"
node-gyp build
cd ../oniguruma
notice "rebuild oniguruma"
nw-gyp rebuild --arch=$arch "--target=$NW_VERSION" --dist-url=https://registry.npmmirror.com/-/binary/nwjs
if [ "$arch" == "loong64" ];then
  export CFLAGS="$BAK_CFLAGS"
  export CXXFLAGS="$BAK_CXXFLAGS"
fi

cd ..

cp -fr "spdlog" "spdlog-node"
cd spdlog-node
node-gyp configure "$configure_args"
node-gyp build
cd ..
mkdir -p @vscode
cp -fr "spdlog-node" "@vscode/spdlog18"
cd spdlog
notice "rebuild spdlog"
nw-gyp rebuild --arch=$arch "--target=$NW_VERSION" --dist-url=https://registry.npmmirror.com/-/binary/nwjs
cd ..

cd @vscode/sqlite3
notice "Build @vscode/sqlite3"
node-gyp configure "$configure_args"
node-gyp build
cd ../..

notice "remove unused files"
find -name ".deps" | xargs -I{} rm -rf {}
find -name "obj.target" | xargs -I{} rm -rf {}
find -name "*.a" -delete
find -name "*.lib" -delete
find -name "*.mk" -delete

# TODO: 检查路径包含空格时，是否正常
notice "copy node files"
(cd "${package_dir}/node_modules_tmp/node_modules" && \
find -name "*.node" | xargs -I{} \cp -rf {} ${package_dir}/node_modules/{})

rm -rf "${package_dir}/node_modules_tmp"
