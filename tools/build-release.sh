#!/bin/bash

# 脚本执行前提，已完成支持wine的基本构建
set -e
root_dir=$(cd `dirname $0`/.. && pwd -P)
tmp_dir="$root_dir/tmp"
build_dir="$tmp_dir/build"
version=$1
ARCH=$2

success() {
    echo -e "\033[42;37m 成功 \033[0m $1"
}
notice() {
    echo -e "\033[36m $1 \033[0m "
}

fail() {
    echo -e "\033[41;37m 失败 \033[0m $1"
}

if [[ $version == '' ]];then
  fail "请指定版本"
  exit 1
elif [[ $ARCH == '' ]];then
  fail "请指定架构"
  exit 1
fi
export ARCH=$ARCH

rm -rf "$build_dir"
mkdir -p "$build_dir"

notice "下载AppImage构建工具"
if [ $ACTION_MODE!='true' ]; then
  appimagetool_host="github.com"
else
  appimagetool_host="download.fastgit.org"
fi
wget "https://$appimagetool_host/AppImage/AppImageKit/releases/download/continuous/appimagetool-x86_64.AppImage" \
  -O "$tmp_dir/appimagetool-x86_64.AppImage"
chmod a+x "$tmp_dir/appimagetool-x86_64.AppImage"

for type in wine no_wine; do
  notice "当前构建类型: $type";
  FULL_NAME="WeChat_Dev_Tools_${version}_${ARCH}_$type"
  if [[ $type == 'no_wine' ]];then
    notice "no wine handle"
    export NO_WINE=true
    bash "$root_dir/tools/fix-core"
    bash "$root_dir/tools/fix-other"
  fi
  mkdir -p "$build_dir/$FULL_NAME"

  # 构建压缩包
  notice "COPY bin"
  \cp -rf "$root_dir/bin" "$build_dir/$FULL_NAME/bin"
  notice "COPY nwjs"
  \cp -drf "$root_dir/nwjs" "$build_dir/$FULL_NAME/nwjs"
  notice "COPY node"
  rm -rf "$build_dir/$FULL_NAME/nwjs/node"
  \cp -rf "$root_dir/node/bin/node" "$build_dir/$FULL_NAME/nwjs/node"
  notice "COPY package.nw"
  \cp -rf "$root_dir/package.nw" "$build_dir/$FULL_NAME/package.nw"
  notice "MAKE tar.gz"
  cd "$build_dir" && tar -zcf "$FULL_NAME.tar.gz" "$FULL_NAME"

  # 构建AppImage
  notice "BUILD AppImage"
  bash "$root_dir/tools/appimage.sh"
  "$tmp_dir/appimagetool-x86_64.AppImage" "$root_dir/tmp/AppDir" "$build_dir/$FULL_NAME.AppImage"

  # 删除构建资源
  notice "DELETE Build Source"
  rm -rf "$build_dir/$FULL_NAME"
done