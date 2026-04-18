#!/bin/bash
set -ex

root_dir=$(cd `dirname $0`/.. && pwd -P)

# 从js获取配置
electron_url=$(node "$root_dir/tools/parse-config.js" --get-electron-url $@)
file_name=$(basename "$electron_url")
# download
local_path="$root_dir/cache/$file_name"
if [ ! -f "$local_path" ]; then
    wget -c -O "$local_path.tmp" "$electron_url"
    mv "$local_path.tmp" "$local_path"
fi
# extract
rm -rf "$root_dir/electron"
mkdir -p "$root_dir/electron"
unzip -q "$local_path" -d "$root_dir/electron"

if [ -f "$root_dir/node/bin/node" ]; then
    cd "$root_dir/electron"
    ln -sr ../node/bin/node node
    ln -s node node.exe
    ln -s node node-18.exe
fi

if [ -d "$root_dir/resources" ]; then
    cd "$root_dir/electron"
    ln -sr ../resources resources
fi