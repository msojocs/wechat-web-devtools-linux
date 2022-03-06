#!/bin/bash

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
if [ -n "$2" ];then
  export VERSION=$2
fi
if [ -n "$1" ];then
  export ARCH=$1
fi

DEVTOOLS_VERSION=$( cat "$root_dir/package.nw/package.json" | grep -m 1 -Eo "\"[0-9]{1}\.[0-9]{2}\.[0-9]+" )
DEVTOOLS_VERSION="${DEVTOOLS_VERSION//\"/}"

if [[ $VERSION == 'continuous' ]];then
  export VERSION="v${DEVTOOLS_VERSION}-continuous"
elif [[ $VERSION == '' ]];then
  export VERSION="v${DEVTOOLS_VERSION}-continuous"
fi
if [[ $ARCH == '' ]];then
  fail "请指定架构"
  exit 1
fi

notice "检查版本号 -> $VERSION"
INPUT_VERSION=$( echo $VERSION | sed 's/v//' | sed 's/-.*//' )
if [[ "$INPUT_VERSION" != "$DEVTOOLS_VERSION" ]];then
  fail "传入版本号与实际版本号不一致！"
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