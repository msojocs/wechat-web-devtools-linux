#!/bin/bash
set -ex
root_dir=$(cd `dirname $0`/.. && pwd -P)
srcdir=$root_dir
tmp_dir="$root_dir/tmp"
cache_dir="$root_dir/cache"
package_dir="$root_dir/resources/app"

shared_memory_version="v1.0.4"
skyline_version="v2.01.2510280-1"

if [ -f "$root_dir/resources/app.asar" ]; then
    $root_dir/tools/asar-helper.sh unpack
fi

cd "$package_dir/node_modules"
mkdir -p "$cache_dir/skyline"
rm -f sharedMemory/sharedMemory.node
if [ ! -f "$cache_dir/skyline/sharedMemory-linux-x86_64-$shared_memory_version.node" ]; then
    wget -c https://github.com/msojocs/skyline-shared-memory/releases/download/$shared_memory_version/skyline-sharedMemory-linux-x86_64-$shared_memory_version.node -O "$cache_dir/skyline/sharedMemory-linux-x86_64-$shared_memory_version.node.tmp"
    mv "$cache_dir/skyline/sharedMemory-linux-x86_64-$shared_memory_version.node.tmp" "$cache_dir/skyline/sharedMemory-linux-x86_64-$shared_memory_version.node"
fi
cp "$cache_dir/skyline/sharedMemory-linux-x86_64-$shared_memory_version.node" sharedMemory/sharedMemory.node

# cd skyline-addon
# rm -f build/skyline.node
# if [ ! -f "$cache_dir/skyline/client-linux-x86_64-$skyline_version.node" ]; then
#     wget -c https://github.com/msojocs/skyline-client-server/releases/download/$skyline_version/skyline-client-linux-x86_64-$skyline_version.node -O "$cache_dir/skyline/client-linux-x86_64-$skyline_version.node.tmp"
#     mv "$cache_dir/skyline/client-linux-x86_64-$skyline_version.node.tmp" "$cache_dir/skyline/client-linux-x86_64-$skyline_version.node"
# fi
# cp "$cache_dir/skyline/client-linux-x86_64-$skyline_version.node" build/skyline.node

# render process调用拦截替换
mv ${package_dir}/js/electron/preload.js ${package_dir}/js/electron/preload.js.bak
cp ${srcdir}/res/scripts/preload.js ${package_dir}/js/electron/preload.js
cat ${package_dir}/js/electron/preload.js.bak >> ${package_dir}/js/electron/preload.js
rm ${package_dir}/js/electron/preload.js.bak

# main process调用拦截替换
mv ${package_dir}/js/electron/main.js ${package_dir}/js/electron/main.js.bak
cp ${srcdir}/res/scripts/main.js ${package_dir}/js/electron/main.js
cat ${package_dir}/js/electron/main.js.bak >> ${package_dir}/js/electron/main.js
rm ${package_dir}/js/electron/main.js.bak

# 颜色反转处理
mv ${package_dir}/js/extensions/skyline/index.js ${package_dir}/js/extensions/skyline/index.js.bak
cp ${srcdir}/res/scripts/skyline.js ${package_dir}/js/extensions/skyline/index.js
cat ${package_dir}/js/extensions/skyline/index.js.bak >> ${package_dir}/js/extensions/skyline/index.js
rm ${package_dir}/js/extensions/skyline/index.js.bak

$root_dir/tools/asar-helper.sh pack