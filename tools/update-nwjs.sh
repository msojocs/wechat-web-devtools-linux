#!/bin/bash
set -ex

root_dir=$(cd `dirname $0`/.. && pwd -P)

# 从js获取配置
nwjs_url=$(node "$root_dir/tools/parse-config.js" --get-nwjs-url $@)
file_name=$(basename "$nwjs_url")
# download
local_path="$root_dir/cache/$file_name"
if [ ! -f "$local_path" ]; then
    wget -c -O "$local_path.tmp" "$nwjs_url"
    mv "$local_path.tmp" "$local_path"
fi
# extract
rm -rf "$root_dir/nwjs"
mkdir -p "$root_dir/nwjs"
tar -xzf "$local_path" -C "$root_dir/nwjs" --strip-components=1

if [ -f "$root_dir/node/bin/node" ]; then
    cd "$root_dir/nwjs"
    ln -sr ../node/bin/node node
    ln -s node node.exe
    ln -s node node-18.exe
fi

if [ -d "$root_dir/package.nw" ]; then
    cd "$root_dir/nwjs"
    ln -sr ../package.nw package.nw
fi