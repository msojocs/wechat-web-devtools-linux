#!/bin/bash
set -ex

root_dir=$(cd "$(dirname "$0")/.." && pwd -P)

docker run -d \
    --network host \
    -e HOST_UID=$(id -u) \
    -e HOST_GID=$(id -g) \
    -v "/dev/shm:/dev/shm" \
    --name wechat_devtools_server \
    devtools-server:2.01.2510290-1