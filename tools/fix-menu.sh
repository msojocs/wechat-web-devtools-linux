#! /bin/bash
# Author: https://github.com/cytle/wechat_web_devtools/issues/293#issuecomment-604623774

set -e

warn() {
    echo -e "\033[43;37m 警告 \033[0m $1"
}
root_dir=$(cd `dirname $0`/.. && pwd -P)
NW_PACKAGE_DIR="$root_dir/package.nw"

cd "$NW_PACKAGE_DIR"
target_file=js/unpack/hackrequire/index.js

if [ ! -f "$target_file" ]; then
    echo -e "\e[1;31m$target_file is not exist\e[0m" >&2
    exit 1
fi
# 判断匹配函数，匹配函数不为0，则包含给定字符
if [ `grep -c "patch wechat devtools begin" $target_file` -ne '0' ];then
    warn "$target_file seems to have been modified"
    exit 0
fi

tmp_file=$(mktemp)
cat "$root_dir/res/scripts/hackrequire.js" > "$tmp_file"
cat "$target_file" >> "$tmp_file"

cat "$tmp_file" > "$target_file"
rm "$tmp_file"
