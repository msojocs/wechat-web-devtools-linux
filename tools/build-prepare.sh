#!/bin/bash

# 用于github actions构建
# 解压初步构建后的文件

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
rm -rf electron resources
# 支持两种 artifact 布局：
#   - 旧布局：打包成 wechat-devtools-<ARCH>.src/ 目录
#   - 新布局：CI 按架构精确下载并 merge 到工作区根目录（src-linux.tar.gz 直接在工作区根）
if [[ "$WINE" != 'true' ]];then
  if [ -f "src-linux.tar.gz" ]; then
    tar -zxf src-linux.tar.gz -C .
  else
    tar -zxf wechat-devtools-*.src/src-linux.tar.gz -C .
  fi
else
  if [ -f "src-wine.tar.gz" ]; then
    tar -zxf src-wine.tar.gz -C .
  else
    tar -zxf wechat-devtools-*.src/src-wine.tar.gz -C .
  fi
fi
