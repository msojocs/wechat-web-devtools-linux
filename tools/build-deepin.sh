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
if [ -n "$1" ];then
  export BUILD_VERSION=$1
fi
if [ -z "$BUILD_VERSION" ];then
  export BUILD_VERSION='continuous'
fi
if [ "$BUILD_VERSION" == "continuous" ];then
  export BUILD_VERSION="v${DEVTOOLS_VERSION}-continuous"
fi

notice "检查版本号 -> $BUILD_VERSION"
INPUT_VERSION=$( echo $BUILD_VERSION | sed 's/v//' | sed 's/-.*//' )
if [[ "$INPUT_VERSION" != "$DEVTOOLS_VERSION" ]];then
  fail "传入版本号与实际版本号不一致！"
  exit 1
fi

############ 准备构建deb包所需的文件及结构 ################
package_name="io.github.msojocs.wechat-devtools"
if [[ $NO_WINE == 'true' ]];then
  BUILD_MARK='no_wine'
  package_name="${package_name}-no-wine"
else
  BUILD_MARK='wine'
  NAME_SUFFIX=" (wine)"
  package_name="${package_name}-wine"
fi

echo "root_dir: $root_dir"
tmp_dir="$root_dir/tmp"
build_dir="$root_dir/tmp/$package_name"
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
mv "$build_dir/opt/apps/io.github.msojocs.wechat-devtools"/* $base_dir
rm -r "$build_dir/opt/apps/io.github.msojocs.wechat-devtools"
sed -i "s/BUILD_VERSION/${BUILD_VERSION//v/}/" "$build_dir/debian/control" "$build_dir/debian/changelog" "$base_dir/info"
sed -i "s/io.github.msojocs.wechat-devtools/$package_name/g" "$base_dir/info" "$build_dir/debian/control" "$build_dir/debian/changelog"
\cp -rf "$root_dir/bin/wechat-devtools" "$base_dir/files/bin/bin/wechat-devtools"
# 时间
build_time=$(LANG=en_US date '+%a, %d %b %Y %H:%M:%S %z')
sed -i "s#[A-Za-z]\+, [0-9]\+ [A-Za-z]\+ [0-9]\+ [0-9]\+:[0-9]\+:[0-9]\+ +[0-9]\+#${build_time}#" "$build_dir/debian/changelog"

# desktop
\cp -rf "$root_dir/res/template.desktop" "$base_dir/entries/applications/$package_name.desktop"
sed -i "s#Icon=dir/res/icons/wechat-devtools.svg#Icon=$package_name#" "$base_dir/entries/applications/$package_name.desktop"
sed -i "s#dir#/opt/apps/$package_name/files/bin#" "$base_dir/entries/applications/$package_name.desktop"
sed -i "s/WeChat Dev Tools/WeChat Dev Tools$NAME_SUFFIX/g" "$base_dir/info" "$base_dir/entries/applications/$package_name.desktop"
sed -i "s/微信开发者工具/微信开发者工具$NAME_SUFFIX/g" "$base_dir/entries/applications/$package_name.desktop"

\cp -rf "$root_dir/res/icons/wechat-devtools.svg" "$base_dir/entries/icons/hicolor/scalable/apps/$package_name.svg"

# 兼容普通deb
mkdir -p "$build_dir/usr/share/applications" "$build_dir/usr/share/icons/hicolor/scalable/apps"
\cp -rf "$base_dir/entries/applications/$package_name.desktop" "$build_dir/usr/share/applications/$package_name.desktop"
\cp -rf "$base_dir/entries/icons/hicolor/scalable/apps/$package_name.svg" "$build_dir/usr/share/icons/hicolor/scalable/apps/$package_name.svg"

# 主体文件
cp -r "$root_dir/package.nw" "$base_dir/files/bin/package.nw"
cp -r "$root_dir/nwjs" "$base_dir/files/bin/nwjs"
if [ -f "$root_dir/node/bin/node" ];then
  rm -rf "$base_dir/files/bin/nwjs"/{node,node.exe}
  cp "$root_dir/node/bin/node" "$base_dir/files/bin/nwjs/node"
  cd "$base_dir/files/bin/nwjs/" && ln -s "node" "node.exe"
fi
# chown -R root:root "$base_dir"

notice "BUILD DEB Package"
cd "$build_dir"
ls -l "$build_dir"
mkdir -p "$root_dir/tmp/build"

if [[ $NO_WINE != 'true' ]];then
  echo "添加wine依赖 - $NO_WINE"
  echo "Depends: wine, wine-binfmt" >> "$build_dir/debian/control"
fi

debuild --no-tgz-check -i -I -b -us -uc
mv $tmp_dir/*.deb $tmp_dir/build