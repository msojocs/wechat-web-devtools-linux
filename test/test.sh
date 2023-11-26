#!/bin/bash

root_dir=$(cd `dirname $0`/.. && pwd -P)
# https://mirror.ghproxy.com/https://github.com/microsoft/ripgrep-prebuilt/releases/download/v12.1.1-1/ripgrep-v12.1.1-1-x86_64-unknown-linux-musl.tar.gz
cd $root_dir
version=0.76.0
tools/update-nwjs-node $version
tar -xf "./cache/nwjs-sdk-v${version}-linux-x64.tar.gz" -C ./cache
./cache/nwjs-sdk-v${version}-linux-x64/nw ./test/node-pty/code 