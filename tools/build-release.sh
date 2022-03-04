#!/bin/bash

# 脚本执行前提，已完成支持wine的基本构建
set -e
root_dir=$(cd `dirname $0`/.. && pwd -P)
tmp_dir="$root_dir/tmp"
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
  fail "请指定版本号"
  exit 1
elif [[ $ARCH == '' ]];then
  fail "请指定架构"
  exit 1
fi

for type in wine no_wine; do
  notice "当前构建类型: $type";
  if [[ $type == 'no_wine' ]];then
    notice "no wine handle"
    export NO_WINE=true
    "$root_dir/tools/fix-core.sh"
    "$root_dir/tools/fix-other.sh"
  fi

  # 构建压缩包
  notice "BUILD Simple Package"
  "$root_dir/tools/build-tar.sh"

  # 构建AppImage
  notice "BUILD AppImage"
  "$root_dir/tools/build-appimage.sh"

done