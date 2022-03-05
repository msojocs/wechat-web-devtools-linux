#!/bin/bash
set -e
notice() {
    echo -e "\033[36m $1 \033[0m "
}

root_dir=$(cd `dirname $0`/.. && pwd -P)
echo $BUILD_VERSION
if [ -z "$BUILD_VERSION" ];then
  export BUILD_VERSION=$1
fi
if [ -z "$BUILD_VERSION" ];then
  export BUILD_VERSION='continuous'
fi
echo $BUILD_VERSION

############ 构建deb包 ################
root_dir=$(cd `dirname $0`/.. && pwd -P)
echo "root_dir: $root_dir"
tmp_dir="$root_dir/tmp"
app_dir="$root_dir/tmp/deb"

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
if [[ ! $BUILD_VERSION -eq 'continuous' ]];then
    sed -i "s/BUILD_VERSION/${BUILD_VERSION//v/}/" "$app_dir/DEBIAN/control"
else
    sed -i "s/BUILD_VERSION/0/" "$app_dir/DEBIAN/control"
fi
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
ver=$( cat "$root_dir/package.nw/package.json" | grep -m 1 -Eo "\"[0-9]{1}\.[0-9]{2}\.[0-9]+" )
ver="${ver//\"/}"
dpkg-deb -b . "$root_dir/tmp/build/WeChat_Dev_Tools_${ver}-${BUILD_VERSION}_amd64.deb"
