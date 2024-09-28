#!/bin/bash
root_dir=$(cd `dirname $0`/.. && pwd -P)
set -ex

cd $root_dir/docker
docker build . -t jiyecafe/wechat-devtools-build:v1.0.4
docker tag jiyecafe/wechat-devtools-build:v1.0.4 jiyecafe/wechat-devtools-build:latest
docker push jiyecafe/wechat-devtools-build:v1.0.4
docker push jiyecafe/wechat-devtools-build:latest