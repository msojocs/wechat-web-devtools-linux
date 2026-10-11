#! /bin/bash

# 数据目录固定为 <userData>/app，原理见 res/scripts/data-path.js
#
# 目标文件是构建时保留的固定路径（package.json 的 main），不随 devtools 版本变化，
# 也不再改动按内容哈希命名的 js/<hash>.js。

set -e

root_dir=$(cd `dirname $0`/.. && pwd -P)

srcdir=$root_dir
package_dir="$root_dir/resources/app"


$root_dir/tools/asar-helper.sh unpack

cd "$package_dir"

apply_prepend_patch() {
    local target_file="$1"
    local patch_file="$2"

    if [ ! -f "$target_file" ]; then
        echo -e "\e[1;31m$target_file is not exist\e[0m" >&2
        $root_dir/tools/asar-helper.sh pack
        exit 1
    fi

    if [ ! -f "$patch_file" ]; then
        echo -e "\e[1;31m$patch_file is not exist\e[0m" >&2
        $root_dir/tools/asar-helper.sh pack
        exit 1
    fi

    local patch_size=$(wc -c < "$patch_file")
    if cmp -s -n "$patch_size" "$patch_file" "$target_file"; then
        echo "$target_file is already patched"
        return
    fi

    local tmp_file=$(mktemp)
    cat "$patch_file" "$target_file" > "$tmp_file"
    cat "$tmp_file" > "$target_file"
    rm "$tmp_file"
}

apply_prepend_patch "$package_dir/js/electron/main.js" "$root_dir/res/scripts/data-path.js"

$root_dir/tools/asar-helper.sh pack
