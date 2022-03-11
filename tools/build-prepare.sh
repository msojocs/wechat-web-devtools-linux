#!/bin/bash

# 脚本执行前提，已完成支持wine的基本构建
set -e
success() {
    echo -e "\033[42;37m 成功 \033[0m $1"
}
notice() {
    echo -e "\033[36m $1 \033[0m "
}
fail() {
    echo -e "\033[41;37m 失败 \033[0m $1"
}

root_dir=$(cd `dirname $0`/.. && pwd -P)
tmp_dir="$root_dir/tmp"
store_dir="$tmp_dir/build"
mkdir -p $store_dir
rm -rf nwjs package.nw
if [[ $NO_WINE == 'true' ]];then
  tar -zxf wechat-devtools-*.src/src-no-wine.tar.gz -C .
else
  tar -zxf wechat-devtools-*.src/src-wine.tar.gz -C .
fi