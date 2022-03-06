#!/bin/bash

notice() {
    echo -e "\033[36m $1 \033[0m "
}
fail() {
    echo -e "\033[41;37m 失败 \033[0m $1"
}


root_dir=$(cd `dirname $0`/.. && pwd -P)
tmp_dir="$root_dir/tmp"
build_dir="$root_dir/tmp/AUR"

# 没有预构建，获取不到
# DEVTOOLS_VERSION=$( cat "$root_dir/package.nw/package.json" | grep -m 1 -Eo "\"[0-9]{1}\.[0-9]{2}\.[0-9]+" )
# DEVTOOLS_VERSION="${DEVTOOLS_VERSION//\"/}"

if [ -n "$1" ];then
  export BUILD_VERSION=$1
fi
if [ -z "$BUILD_VERSION" ];then
  export BUILD_VERSION='continuous'
fi
echo "BUILD_VERSION: $BUILD_VERSION"
# 及时构建修订版本号为0
if [ "$BUILD_VERSION" == "continuous" ];then
  # export BUILD_VERSION="v${DEVTOOLS_VERSION}-0"
  pkgrel='0'
else
  # 提取BUILD_VERSION中的修订版本号
  pkgrel=$( echo $BUILD_VERSION | sed -r 's/v[0-9]+\.[0-9]+\.[0-9]+-(.*)/\1/' )
fi

rm -rf $build_dir
mkdir -p $build_dir
cp "$root_dir/tools"/*.sh "$build_dir"
cp "$root_dir/tools"/*.js "$build_dir"
cp "$root_dir/res/aur"/* "$build_dir"
sed -i 's/download.fastgit.org/github.com/' "$build_dir/PKGBUILD"
sed -i "s/pkgrel=[0-9]\+/pkgrel=${pkgrel}/" "$build_dir/PKGBUILD"

if [ "$BUILD_VERSION" != "continuous" ];then
  notice "检查版本号 -> $BUILD_VERSION"
  CONFIG_VERSION=$( cat "$build_dir/PKGBUILD" | grep -m 1 -Eo "[0-9]{1}\.[0-9]{2}\.[0-9]+" )
  INPUT_VERSION=$( echo $BUILD_VERSION | sed 's/v//' | sed 's/-.*//' )
  if [[ "$INPUT_VERSION" != "$CONFIG_VERSION" ]];then
    fail "传入版本号与实际版本号不一致！"
    exit 1
  fi
fi

cd $build_dir
# makepkg