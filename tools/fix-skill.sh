#!/bin/bash

set -e

warn() {
    echo -e "\033[43;37m 警告 \033[0m $1"
}
root_dir=$(cd `dirname $0`/.. && pwd -P)

srcdir=$root_dir
package_dir="$root_dir/resources/app.asar.unpacked"


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

apply_append_patch() {
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
    if cmp -s "$patch_file" <(tail -c "$patch_size" "$target_file"); then
        echo "$target_file is already patched"
        return
    fi

    local tmp_file=$(mktemp)
    cat "$target_file" "$patch_file" > "$tmp_file"
    cat "$tmp_file" > "$target_file"
    rm "$tmp_file"
}

apply_append_patch "$package_dir/wechatide-skill/skills/installer/scripts/install-root.mjs" "$root_dir/res/scripts/skills/install-root.js"
apply_prepend_patch "$package_dir/js/common/cli/skill-index.js" "$root_dir/res/scripts/skills/skill-index.js"