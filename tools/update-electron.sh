#!/bin/bash
root_dir=$(cd `dirname $0`/.. && pwd -P)
source "$root_dir/tools/error-handler.sh"
devtools_enable_error_trap
set -ex

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

if [ -d "$root_dir/resources" ]; then
    cd "$root_dir/electron"
    rm -rf resources
    ln -sr ../resources resources
fi
