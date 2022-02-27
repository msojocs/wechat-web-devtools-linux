#!/bin/bash
export ARCH=x86_64

root_dir=$(cd `dirname $0`/.. && pwd -P)
tmp_dir="$root_dir/tmp"
app_dir="$root_dir/tmp/AppDir"

# Remove any previous build
rm -rf $app_dir
# Make usr and icons dirs
mkdir -p $app_dir/bin
mkdir -p $app_dir/usr/{src,bin}
mkdir -p $app_dir/usr/share/{metainfo,icons}

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