#!/bin/bash
root_dir=$(cd `dirname $0`/.. && pwd -P)
NW_VERSION=0.53.0
ln -s $( which python2 ) "$root_dir/tmp/python"
export PATH="$root_dir/tmp:$PATH"
export all_proxy="sock5://127.0.0.1:7890"

cd /mnt/disk1/GitHub/wechat-devtools-linux/node_modules/node-pty
nw-gyp rebuild --arch=x64 "--target=$NW_VERSION" --dist-url=https://registry.npmmirror.com/-/binary/nwjs