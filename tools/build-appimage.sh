#!/bin/bash
notice() {
    echo -e "\033[36m $1 \033[0m "
}

if [ -z $VERSION ];then
  export VERSION=$1
fi
if [ -z $ARCH ];then
  export ARCH=$2
fi

if [[ $NO_WINE == 'true' ]];then
  TYPE='no_wine'
else
  TYPE='wine'
fi

root_dir=$(cd `dirname $0`/.. && pwd -P)
tmp_dir="$root_dir/tmp"
app_dir="$tmp_dir/AppDir"
build_dir="$tmp_dir/build"

notice "下载AppImage构建工具 ACTION_MODE:$ACTION_MODE"
if [[ $ACTION_MODE == 'false' ]]; then
  appimagetool_host="download.fastgit.org"
else
  appimagetool_host="github.com"
fi
if [ ! -f "$tmp_dir/appimagetool-x86_64.AppImage" ];then
  wget "https://$appimagetool_host/AppImage/AppImageKit/releases/download/continuous/appimagetool-x86_64.AppImage" \
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
cp "$root_dir/res/appimage.desktop" "$app_dir/wechat-devtools.desktop"
cp "$root_dir/res/icons/wechat-devtools.png" "$app_dir/wechat-devtools.png"

cat > "$app_dir/AppRun" <<- EOF
#!/bin/bash
exec \$APPDIR/bin/wechat-devtools
EOF
chmod +x "$app_dir/AppRun"

cp -r "$root_dir/package.nw" "$app_dir/package.nw"
cp -r "$root_dir/nwjs" "$app_dir/nwjs"
rm -rf "$app_dir/nwjs/node" "$app_dir/nwjs/node.exe"
cp -r "$root_dir/node/bin/node" "$app_dir/nwjs/node"
cd "$app_dir/nwjs/" && ln -s "node" "node.exe"
cd "$app_dir"

# appimagetool $app_dir
notice "MAKE APPIMAGE"
ver=$( cat "$root_dir/package.nw/package.json" | grep -m 1 -Eo "\"[0-9]{1}\.[0-9]{2}\.[0-9]+" )
ver="${ver//\"/}"
"$tmp_dir/appimagetool-x86_64.AppImage" "$app_dir" "$build_dir/WeChat_Dev_Tools_${ver}_${VERSION}_${ARCH}_${TYPE}.AppImage"

rm -rf $app_dir