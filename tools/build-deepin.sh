#!/bin/bash
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
if [ -z "$BUILD_VERSION" ];then
  export BUILD_VERSION=$1
fi
if [ -z "$BUILD_VERSION" ];then
  export BUILD_VERSION='continuous'
fi
if [ "$BUILD_VERSION" == "continuous" ];then
  export BUILD_VERSION="v${DEVTOOLS_VERSION}-continuous"
fi
echo $BUILD_VERSION

notice "检查版本号 -> $BUILD_VERSION"
INPUT_VERSION=$( echo $BUILD_VERSION | sed 's/v//' | sed 's/-.*//' )
if [[ "$INPUT_VERSION" != "$DEVTOOLS_VERSION" ]];then
  fail "传入版本号与实际版本号不一致！"
  exit 1
fi

############ 构建deb包 ################
root_dir=$(cd `dirname $0`/.. && pwd -P)
echo "root_dir: $root_dir"
tmp_dir="$root_dir/tmp"
build_dir="$root_dir/tmp/deepin"
package_name="io.github.msojocs.wechat-devtools"
base_dir="$build_dir/opt/apps/$package_name"

# Remove any previous build
rm -rf $build_dir
# Make usr and icons dirs
notice "Make Dirs"
mkdir -p $base_dir/{entries,files}
mkdir -p $base_dir/entries/{applications,icons/hicolor/scalable/apps/,mime,plugins,services}
mkdir -p $base_dir/files/{bin/bin,doc,lib}

notice "COPY Files"
cp -r "$root_dir/res/deepin"/* $build_dir
sed -i "s/BUILD_VERSION/${BUILD_VERSION//v/}/" "$build_dir/DEBIAN/control"
sed -i "s/BUILD_VERSION/${BUILD_VERSION//v/}/" "$base_dir/info"
\cp -rf "$root_dir/bin/wechat-devtools" "$base_dir/files/bin/bin/wechat-devtools"

# desktop
\cp -rf "$root_dir/res/template.desktop" "$base_dir/entries/applications/wechat-devtools.desktop"
sed -i 's#Icon=dir/res/icons/wechat-devtools.svg#Icon=io.github.msojocs.wechat-devtools#' "$base_dir/entries/applications/wechat-devtools.desktop"
sed -i "s#dir#/opt/apps/$package_name/files/bin#" "$base_dir/entries/applications/wechat-devtools.desktop"

\cp -rf "$root_dir/res/icons/wechat-devtools.svg" "$base_dir/entries/icons/hicolor/scalable/apps/io.github.msojocs.wechat-devtools.svg"

cp -r "$root_dir/package.nw" "$base_dir/files/bin/package.nw"
cp -r "$root_dir/nwjs" "$base_dir/files/bin/nwjs"
rm -rf "$base_dir/files/bin/nwjs"/{node,node.exe}
cp "$root_dir/node/bin/node" "$base_dir/files/bin/nwjs/node"
cd "$base_dir/files/bin/nwjs/" && ln -s "node" "node.exe"

notice "BUILD DEB Package"
cd "$build_dir"
ls -l "$build_dir"
mkdir -p "$root_dir/tmp/build"
dpkg-deb -b . "$root_dir/tmp/build/WeChat_Dev_Tools_${BUILD_VERSION}_deepin_amd64.deb"
