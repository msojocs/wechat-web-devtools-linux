#!/bin/bash
root_dir=$(cd `dirname $0`/../../.. && pwd -P)
# pkg_dir="/mnt/disk1/Project/WeCuit-Project/WeCuit-Mini-uni-test_uni_vue-cli/dist/build/mp-weixin"
pkg_dir="/home/msojocs/Documents/we1"
store_dir="$root_dir/test/wcc/ll/1"

# cd "$pkg_dir" && \
# wine "$root_dir/package.nw/js/vendor/wcc.exe" "-d" \
# "--split" ">_<6427" \
# "-xc" "2>_<6427./pages/index/index.wxml>_<64270>_<6427./pages/logs/logs.wxml>_<64270" "./pages/index/index.wxml" "./pages/logs/logs.wxml" \
# "-gn" "\$gwx" \
# "-ll" "./pages/index/index>_<6427./pages/logs/logs"

cd "$pkg_dir" && \
/mnt/disk1/GitHub/wechat-devtools-linux/compiler/wcc "-d" \
"--split" ">_<6427" \
"-xc" "2>_<6427./pages/index/index.wxml>_<64270>_<6427./pages/logs/logs.wxml>_<64270" "./pages/index/index.wxml" "./pages/logs/logs.wxml" \
"-gn" "\$gwx" \
"-ll" "./pages/index/index>_<6427./pages/logs/logs"