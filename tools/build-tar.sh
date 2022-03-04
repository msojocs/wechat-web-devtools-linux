#!/bin/bash

# 脚本执行前提，已完成支持wine的基本构建
set -e
root_dir=$(cd `dirname $0`/.. && pwd -P)
tmp_dir="$root_dir/tmp"
store_dir="$tmp_dir/build"
mkdir -p $store_dir
if [ -z $VERSION ];then
  export VERSION=$1
fi
if [ -z $ARCH ];then
  export ARCH=$2
fi

success() {
    echo -e "\033[42;37m 成功 \033[0m $1"
}
notice() {
    echo -e "\033[36m $1 \033[0m "
}

fail() {
    echo -e "\033[41;37m 失败 \033[0m $1"
}

if [[ $VERSION == '' ]];then
  fail "请指定版本"
  exit 1
elif [[ $ARCH == '' ]];then
  fail "请指定架构"
  exit 1
fi

if [[ $NO_WINE == 'true' ]];then
  TYPE='no_wine'
else
  TYPE='wine'
fi

build_dir="$tmp_dir/tar/WeChat_Dev_Tools_${VERSION}_${ARCH}_${TYPE}"
mkdir -p $build_dir
notice "COPY bin"
\cp -rf "$root_dir/bin" "$build_dir/bin"
notice "COPY nwjs"
\cp -drf "$root_dir/nwjs" "$build_dir/nwjs"
notice "COPY node"
rm -rf "$build_dir/nwjs/node"
\cp -rf "$root_dir/node/bin/node" "$build_dir/nwjs/node"
notice "COPY package.nw"
\cp -rf "$root_dir/package.nw" "$build_dir/package.nw"

notice "MAKE tar.gz"
ver=$( cat "$root_dir/package.nw/package.json" | grep -m 1 -Eo "\"[0-9]{1}\.[0-9]{2}\.[0-9]+" )
ver="${ver//\"/}"
cd "$tmp_dir/tar" && tar -zcf "$store_dir/WeChat_Dev_Tools_${ver}_${VERSION}_${ARCH}_${TYPE}.tar.gz" "WeChat_Dev_Tools_${VERSION}_${ARCH}_${TYPE}"
rm -rf $build_dir