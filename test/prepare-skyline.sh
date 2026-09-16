#!/bin/bash

root_dir=$(cd `dirname $0`/.. && pwd -P)

cd $root_dir/resources/app/node_modules/skyline-addon/build
ln -s /home/msojocs/github/skyline-client-server/packages/native/build/x86_64-unknown-linux-gnu/main-client.node main-client.node
ln -s /home/msojocs/github/skyline-client-server/packages/native/build/x86_64-unknown-linux-gnu/render-client.node render-client.node