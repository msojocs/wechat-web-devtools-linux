#!/bin/bash
root_dir=$(cd `dirname $0`/.. && pwd -P)
cd $root_dir/docker
docker build . --name jiyecafe/wechat-devtools-build:latest
# docker tag wechat-web-devtools-linux_wechat_devtools jiyecafe/wechat-devtools-build:latest
docker push jiyecafe/wechat-devtools-build:latest