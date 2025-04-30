#!/bin/bash
set -ex
root_dir=$(cd `dirname $0`/.. && pwd -P)
srcdir=$root_dir
tmp_dir="$root_dir/tmp"
cache_dir="$root_dir/cache"
nwjs_dir="$root_dir/nwjs"
package_dir="$root_dir/package.nw"

shared_memory_version="v1.0.2"
skyline_version="v1.0.2"

cd "$package_dir/node_modules"
rm sharedMemory/sharedMemory.node
wget -c https://github.com/msojocs/skyline-shared-memory/releases/download/$shared_memory_version/skyline-sharedMemory-linux-x86_64-$shared_memory_version.node -OsharedMemory/sharedMemory.node

cd skyline-addon
rm build/skyline.node
wget -c https://github.com/msojocs/skyline-client-server/releases/download/$skyline_version/skyline-skylineClient-linux-x86_64-$skyline_version.node -Obuild/skyline.node
rm build/icudtl.dat
rm -rf bundle

mv ${package_dir}/js/extensions/inject/documentstart/index.js ${package_dir}/js/extensions/inject/documentstart/index.js.bak
cp ${srcdir}/res/scripts/document_start.js ${package_dir}/js/extensions/inject/documentstart/index.js
cat ${package_dir}/js/extensions/inject/documentstart/index.js.bak >> ${package_dir}/js/extensions/inject/documentstart/index.js
rm ${package_dir}/js/extensions/inject/documentstart/index.js.bak