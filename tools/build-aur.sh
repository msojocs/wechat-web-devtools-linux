#!/bin/bash
set -e
notice() {
    echo -e "\033[36m $1 \033[0m "
}
fail() {
    echo -e "\033[41;37m 失败 \033[0m $1"
}

root_dir=$(cd `dirname $0`/.. && pwd -P)
tmp_dir="$root_dir/tmp"
build_dir="$root_dir/tmp/AUR"

VERSION_DATA=$( cat "$root_dir/conf/devtools_v" )
VERSION_DATA=(${VERSION_DATA//,/ })
TARGET_VERSION=${VERSION_DATA[0]}
TARGET_VERSION_MD5=${VERSION_DATA[1]}

if [ -n "$1" ];then
  export BUILD_VERSION=$1
fi
if [ -z "$BUILD_VERSION" ];then
  export BUILD_VERSION='continuous'
fi
echo "BUILD_VERSION: $BUILD_VERSION"
# 及时构建修订版本号为0
if [ "$BUILD_VERSION" == "continuous" ];then
  pkgrel='0'
else
  # 提取BUILD_VERSION中的修订版本号
  pkgrel=$( echo $BUILD_VERSION | sed -r 's/v[0-9]+\.[0-9]+\.[0-9]+-(.*)/\1/' )
fi

# 非及时构建
if [ "$BUILD_VERSION" != "continuous" ];then
  notice "检查版本号 -> $BUILD_VERSION"
  VERSION_DATA=$( cat "$root_dir/conf/devtools_v" )
  VERSION_DATA=(${VERSION_DATA//,/ })
  DEVTOOLS_VERSION=${VERSION_DATA[0]}
  INPUT_VERSION=$( echo $BUILD_VERSION | sed 's/v//' | sed 's/-.*//' )
  if [[ "$INPUT_VERSION" != "$DEVTOOLS_VERSION" ]];then
    fail "传入版本号与实际版本号不一致！"
    exit 1
  fi
fi

rm -rf $build_dir
mkdir -p $build_dir
cp "$root_dir/tools"/*.sh "$build_dir"
cp "$root_dir/tools"/*.js "$build_dir"
cp "$root_dir/res/aur"/* "$build_dir"
sed -i 's/download.fastgit.org/github.com/' "$build_dir/PKGBUILD"
sed -i "s/pkgrel=[0-9]\+/pkgrel=${pkgrel}/" "$build_dir/PKGBUILD"
sed -i "s/_wechat_devtools_ver=\"[0-9]\+\.[0-9]\+\.[0-9]\+\"/_wechat_devtools_ver=\"${TARGET_VERSION}\"/" "$build_dir/PKGBUILD"
sed -i "s/_wechat_devtools_md5=\".*\+\"/_wechat_devtools_md5=\"${TARGET_VERSION_MD5}\"/" "$build_dir/PKGBUILD"

cd $build_dir
# makepkg