#!/bin/bash

# 参数：
# $1 - 版本 v1.05.2203030-2 | continuous

set -e
notice() {
    echo -e "\033[36m $1 \033[0m "
}

fail() {
    echo -e "\033[41;37m 失败 \033[0m $1"
}

root_dir=$(cd `dirname $0`/.. && pwd -P)
DEVTOOLS_VERSION=$( cat "$root_dir/package.nw/package.json" | grep -m 1 -Eo "\"[0-9]{1}\.[0-9]{2}\.[0-9]+" )
DEVTOOLS_VERSION="${DEVTOOLS_VERSION//\"/}"
echo $BUILD_VERSION
if [ -n "$1" ];then
  export BUILD_VERSION=$1
fi
if [ -z "$BUILD_VERSION" ];then
  export BUILD_VERSION='continuous'
fi
if [ "$BUILD_VERSION" == "continuous" ];then
  export BUILD_VERSION="v${DEVTOOLS_VERSION}-continuous"
fi
echo $BUILD_VERSION

############ 构建deb包 ################
root_dir=$(cd `dirname $0`/.. && pwd -P)
echo "root_dir: $root_dir"
tmp_dir="$root_dir/tmp"
app_dir="$root_dir/tmp/deb"

notice "检查版本号"
INPUT_VERSION=$( echo $BUILD_VERSION | sed 's/v//' | sed 's/-.*//' )
if [[ "$INPUT_VERSION" != "$DEVTOOLS_VERSION" ]];then
  fail "传入版本号与实际版本号不一致！"
  exit 1
fi

# Remove any previous build
rm -rf $app_dir
# Make usr and icons dirs
notice "Make Dirs"
mkdir -p $app_dir/opt/wechat-devtools/bin
mkdir -p $app_dir/usr/{src,bin}
mkdir -p $app_dir/usr/share/{metainfo,icons,applications}

notice "COPY Files"
cp -r "$root_dir/res/deb/data"/* $app_dir
cp "$root_dir/bin/wechat-devtools" "$app_dir/opt/wechat-devtools/bin"
cp "$root_dir/res/template.desktop" "$app_dir/usr/share/applications/wechat-devtools.desktop"
sed -i 's#Icon=dir/res/icons/wechat-devtools.svg#Icon=wechat-devtools#' "$app_dir/usr/share/applications/wechat-devtools.desktop"
sed -i "s#dir#/opt/wechat-devtools#" "$app_dir/usr/share/applications/wechat-devtools.desktop"
sed -i "s/BUILD_VERSION/${BUILD_VERSION//v/}/" "$app_dir/DEBIAN/control"
cp "$root_dir/res/icons/wechat-devtools.svg" "$app_dir/usr/share/icons/wechat-devtools.svg"

cp -r "$root_dir/package.nw" "$app_dir/opt/wechat-devtools/package.nw"
cp -r "$root_dir/nwjs" "$app_dir/opt/wechat-devtools/nwjs"
rm -rf "$app_dir/opt/wechat-devtools/nwjs"/{node,node.exe}
cp "$root_dir/node/bin/node" "$app_dir/opt/wechat-devtools/nwjs/node"
cd "$app_dir/opt/wechat-devtools/nwjs/" && ln -s "node" "node.exe"

notice "BUILD DEB Package"
cd "$root_dir/tmp/deb"
ls -l "$root_dir/tmp/deb"
mkdir -p "$root_dir/tmp/build"
dpkg-deb -b . "$root_dir/tmp/build/WeChat_Dev_Tools_${BUILD_VERSION}_amd64.deb"
