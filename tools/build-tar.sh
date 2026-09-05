#!/bin/bash

# 打包成tar.gz

# 参数：
# $1 - 版本 v1.05.2203030-2
# $2 - 平台 x86_64


# 脚本执行前提，已完成支持wine的基本构建
set -e
success() {
    echo -e "\033[42;37m 成功 \033[0m $1"
}
notice() {
    echo -e "\033[36m $1 \033[0m "
}
fail() {
    echo -e "\033[41;37m 失败 \033[0m $1"
}

root_dir=$(cd `dirname $0`/.. && pwd -P)
tmp_dir="$root_dir/tmp"
store_dir="$tmp_dir/build"
mkdir -p $store_dir
if [ -n "$1" ];then
  export VERSION=$1
fi
if [ -n "$2" ];then
  export ARCH=$2
fi
if [[ $VERSION == '' ]];then
  fail "请指定版本"
  exit 1
elif [[ $ARCH == '' ]];then
  fail "请指定架构"
  exit 1
fi

if [[ "$WINE" != 'true' ]];then
  TYPE='linux'
else
  TYPE='wine'
fi

notice "检查版本号"
DEVTOOLS_VERSION=$("$root_dir/electron/node" -p \
  "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8')).version" \
  "$root_dir/resources/app.asar.unpacked/package.json")
INPUT_VERSION=$( echo $VERSION | sed 's/v//' | sed 's/-.*//' )
if [[ "$INPUT_VERSION" != "$DEVTOOLS_VERSION" ]];then
  fail "传入版本号与实际版本号不一致！"
  exit 1
fi

PACKAGE_NAME="WeChat_Dev_Tools_${VERSION}_${ARCH}_${TYPE}"
build_dir="$tmp_dir/tar/$PACKAGE_NAME"
rm -rf "$build_dir"
mkdir -p "$build_dir"
notice "COPY bin"
\cp -rf "$root_dir/bin" "$build_dir/bin"
notice "COPY electron"
\cp -arf "$root_dir/electron" "$build_dir/electron"
notice "COPY resources"
\cp -arf "$root_dir/resources" "$build_dir/resources"
notice "EMBED node"
if [ -f "$root_dir/node/bin/node" ];then
  rm -f "$build_dir/electron/node" "$build_dir/electron/node.exe" "$build_dir/electron/node-18.exe"
  install -m 755 "$root_dir/node/bin/node" "$build_dir/electron/node"
  ln -s node "$build_dir/electron/node.exe"
  ln -s node "$build_dir/electron/node-18.exe"
fi
if [ ! -x "$build_dir/electron/node" ]; then
  fail "Electron运行时缺少Node可执行文件"
  exit 1
fi

notice "MAKE tar.gz"
cd "$tmp_dir/tar" && tar -zcf "$store_dir/$PACKAGE_NAME.tar.gz" "$PACKAGE_NAME"
rm -rf "$build_dir"
