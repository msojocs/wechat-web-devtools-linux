#! /bin/bash

root_dir=$(cd `dirname $0`/.. && pwd -P)
source "$root_dir/tools/error-handler.sh"
devtools_enable_error_trap
set -e
PATCH_FILE="$root_dir/res/scripts/cli.js"

patch_cli() {
    local package_dir="$1"
    local target_file="$package_dir/js/common/cli/index.js"
    local patch_size
    local tmp_file

    if [ ! -f "$target_file" ]; then
        echo -e "\e[1;31m$target_file does not exist\e[0m" >&2
        exit 1
    fi

    patch_size=$(wc -c < "$PATCH_FILE")
    if cmp -s -n "$patch_size" "$PATCH_FILE" "$target_file"; then
        echo "$target_file is already patched"
        return
    fi

    tmp_file=$(mktemp)
    cat "$PATCH_FILE" "$target_file" > "$tmp_file"
    cat "$tmp_file" > "$target_file"
    rm "$tmp_file"
}

# patch_cli "$root_dir/resources/app"
patch_cli "$root_dir/resources/app.asar.unpacked"

if [ -f "$root_dir/resources/app.asar.unpacked/js/common/cli/skill-index.js" ]; then
    node "$root_dir/tools/fix-skill-cli.js"
fi
