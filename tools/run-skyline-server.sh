#!/bin/bash
set -ex

root_dir=$(cd "$(dirname "$0")/.." && pwd -P)

docker run -d \
    --network host \
    -e HOST_UID=$(id -u) \
    -e HOST_GID=$(id -g) \
    -e XVFB_RES=800x600x24 \
    -v $HOME/.config/wechat-devtools/WeappPlugin:/workspace/WeappPlugin \
    -v $root_dir/package.nw/js/ideplugin:/workspace/inspector \
    -v "/dev/shm:/dev/shm" \
    --name wechat_devtools_server \
    devtools-server:2.01.2510280-1