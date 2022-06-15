#!/bin/bash

# 构建AppImage

# 参数：
# $1 - 版本 v1.05.2203030-2
# $2 - 平台 x86_64

set -e
notice() {
    echo -e "\033[36m $1 \033[0m "
}
fail() {
    echo -e "\033[41;37m 失败 \033[0m $1"
}

if [ -n "$1" ];then
  export VERSION=$1
fi
if [ -n "$2" ];then
  export ARCH=$2
fi

if [[ $VERSION == '' ]];then
  fail "请指定版本"
  exit 1
elif [[ $ARCH == '' ]];then
  fail "请指定架构"
  exit 1
fi

if [[ "$WINE" != 'true' ]];then
  TYPE='no_wine'
else
  TYPE='wine'
fi

root_dir=$(cd `dirname $0`/.. && pwd -P)
tmp_dir="$root_dir/tmp"
app_dir="$tmp_dir/AppDir"
build_dir="$tmp_dir/build"
mkdir -p $build_dir

notice "检查版本号"
DEVTOOLS_VERSION=$( cat "$root_dir/package.nw/package.json" | grep -m 1 -Eo "\"[0-9]{1}\.[0-9]{2}\.[0-9]+" )
DEVTOOLS_VERSION="${DEVTOOLS_VERSION//\"/}"
INPUT_VERSION=$( echo $VERSION | sed 's/v//' | sed 's/-.*//' )
if [[ "$INPUT_VERSION" != "$DEVTOOLS_VERSION" ]];then
  fail "传入版本号与实际版本号不一致！"
  exit 1
fi

notice "下载AppImage构建工具 ACTION_MODE:$ACTION_MODE"
if [[ $ACTION_MODE != 'true' ]]; then
  appimagetool_host="https://mirror.ghproxy.com/"
fi
if [ ! -f "$tmp_dir/appimagetool-x86_64.AppImage" ];then
  wget "${appimagetool_host}https://github.com/AppImage/AppImageKit/releases/download/continuous/appimagetool-x86_64.AppImage" \
    -O "$tmp_dir/appimagetool-x86_64.AppImage"
fi
chmod a+x "$tmp_dir/appimagetool-x86_64.AppImage"

# Remove any previous build
rm -rf $app_dir
# Make usr and icons dirs
mkdir -p $app_dir/bin
mkdir -p $app_dir/usr/{src,bin}
mkdir -p $app_dir/usr/share/{metainfo,icons}

notice "COPY FILES"
cp "$root_dir/bin/wechat-devtools" "$app_dir/bin/wechat-devtools"
cp "$root_dir/bin/wechat-devtools-cli" "$app_dir/bin/wechat-devtools-cli"
cp "$root_dir/res/icons/512x512.png" "$app_dir/wechat-devtools.png"
\cp -rf "$root_dir/res/appimage"/* "$app_dir"
cp $app_dir/usr/share/applications/*.desktop "$app_dir/io.github.msojocs.wechat_devtools.desktop"

cat > "$app_dir/AppRun" <<- 'EOF'
#!/bin/bash
if [[ $1 == 'cli' ]];then
    exec $APPDIR/bin/wechat-devtools-cli ${@:2}
else
    exec $APPDIR/bin/wechat-devtools
fi
EOF
chmod +x "$app_dir/AppRun"

cp -r "$root_dir/package.nw" "$app_dir/package.nw"
cp -r "$root_dir/nwjs" "$app_dir/nwjs"
if [ -f $root_dir/node/bin/node ];then
  rm -rf "$app_dir/nwjs/node" "$app_dir/nwjs/node.exe"
  cp "$root_dir/node/bin/node" "$app_dir/nwjs/node"
  cd "$app_dir/nwjs/" && ln -s "node" "node.exe"
fi
cd "$app_dir"

# appimagetool $app_dir
notice "MAKE APPIMAGE"
"$tmp_dir/appimagetool-x86_64.AppImage" "$app_dir" "$build_dir/WeChat_Dev_Tools_${VERSION}_${ARCH}_${TYPE}.AppImage"

rm -rf $app_dir