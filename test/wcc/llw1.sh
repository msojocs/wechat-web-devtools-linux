#!/bin/bash
# 本脚本用于测试wcc编译器带llw参数时的编译结果
root_dir=$(cd `dirname $0`/../.. && pwd -P)
pkg_dir="/mnt/disk1/Project/WeCuit-Project/WeCuit-Mini-uni-test_uni_vue-cli/dist/build/mp-weixin"
pkg_dir="/home/msojocs/Documents/we1"

cd "$pkg_dir" && \
wine "$root_dir/package.nw/js/vendor/wcc.exe" "-d" "--split" ">_<9657" "-cc" "2>_<9657./pages/index/index.wxml>_<96570>_<9657./pages/logs/logs.wxml>_<96570" "-llw" "./pages/index/index>_<9657./pages/logs/logs" "./pages/index/index.wxml" "./pages/logs/logs.wxml" "-gn" "\$gwx" > "$root_dir/test/wcc/llw/1/wine.json"

echo "==================="

cd "$pkg_dir" && \
"$root_dir/compiler/nodejs/wcc" "-d" "--split" ">_<9657" "-cc" "2>_<9657./pages/index/index.wxml>_<96570>_<9657./pages/logs/logs.wxml>_<96570" "-llw" "./pages/index/index>_<9657./pages/logs/logs" "./pages/index/index.wxml" "./pages/logs/logs.wxml" "-gn" "\$gwx" > "$root_dir/test/wcc/llw/1/nodejs.json"