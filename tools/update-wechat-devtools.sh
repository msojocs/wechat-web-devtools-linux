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
7z x "$local_path" -o"$extract_path" "resources" -y

# 替换
rm -rf "$root_dir/resources"
mv "$extract_path/resources" "$root_dir/resources"
chmod -R 755 "$root_dir/resources"
rm -rf "$extract_path"

if [ -d "$root_dir/electron" ]; then
    cd "$root_dir/electron"
    ln -sr ../resources resources
fi

# 写入时间戳
timestamp=$(date +%s)
echo "$timestamp" > "$root_dir/resources/.build_time"
