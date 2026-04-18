#!/bin/bash
set -ex

root_dir=$(cd `dirname $0`/.. && pwd -P)

wechat_devtools_url=$(node "$root_dir/tools/parse-config.js" --get-devtools-url $@)
wechat_devtools_version=$(node "$root_dir/tools/parse-config.js" --get-devtools-version $@)

# 下载
local_path="$root_dir/cache/wechat_devtools_${wechat_devtools_version}_x64.exe"
if [ ! -f "$local_path" ]; then
    wget -c "$wechat_devtools_url" -O "$local_path.tmp"
    mv "$local_path.tmp" "$local_path"
fi

# 解压
extract_path="$root_dir/tmp/$(dirname $local_path)"
mkdir -p "$extract_path"
7z x "$local_path" -o"$extract_path" "code/package.nw" -y

# 替换
rm -rf "$root_dir/package.nw"
mv "$extract_path/code/package.nw" "$root_dir/package.nw"
chmod -R 755 "$root_dir/package.nw"
rm -rf "$extract_path"

if [ -d "$root_dir/nwjs" ]; then
    cd "$root_dir/nwjs"
    ln -sr ../package.nw package.nw
fi

if [ -f "$root_dir/package.nw/js/common/miniprogram-builder/modules/fullcompiler/app/contactandlaunch/updateContactAndLaunch.js" ]; then
    mv "$root_dir/package.nw/js/common/miniprogram-builder/modules/fullcompiler/app/contactandlaunch/updateContactAndLaunch.js" \
       "$root_dir/package.nw/js/common/miniprogram-builder/modules/fullcompiler/app/contactandlaunch/updatecontactandlaunch.js"
fi

# 写入时间戳
timestamp=$(date +%s)
echo "$timestamp" > "$root_dir/package.nw/.build_time"