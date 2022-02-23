#!/bin/bash
# 本脚本用于测试wcc编译器带llw参数时的编译结果
root_dir=$(cd `dirname $0`/../.. && pwd -P)
pkg_dir="/mnt/disk1/Project/WeCuit-Project/WeCuit-Mini-uni-test_uni_vue-cli/dist/build/mp-weixin"
pkg_dir="/home/msojocs/Documents/we1"

store_dir="$root_dir/test/wcc/llw/1"

cd "$pkg_dir" && \
wine "$root_dir/package.nw/js/vendor/wcc.exe" "-d" "--split" ">_<9657" "-cc" "2>_<9657./pages/index/index.wxml>_<96570>_<9657./pages/logs/logs.wxml>_<96570" "-llw" "./pages/index/index>_<9657./pages/logs/logs" "./pages/index/index.wxml" "./pages/logs/logs.wxml" "-gn" "\$gwx" > "$store_dir/wine.json"

echo "==================="

cd "$pkg_dir" && \
"$root_dir/compiler/nodejs/wcc" "-d" "--split" ">_<9657" "-cc" "2>_<9657./pages/index/index.wxml>_<96570>_<9657./pages/logs/logs.wxml>_<96570" "-llw" "./pages/index/index>_<9657./pages/logs/logs" "./pages/index/index.wxml" "./pages/logs/logs.wxml" "-gn" "\$gwx" > "$store_dir/nodejs.json"

diff "$store_dir/wine.json" "$store_dir/nodejs.json" >/dev/null
if  [ "$?" == "0" ];then
    echo "the file or dir is same!"
else 
     echo "the file or dir is different!"
fi