#!/bin/bash

root_dir=$(cd `dirname $0`/.. && pwd -P)
echo $BUILD_VERSION
if [ -z "$BUILD_VERSION" ];then
  export BUILD_VERSION=$1
fi
echo $BUILD_VERSION
cd $root_dir/res/deb
pwd
# docker-compose down
docker-compose up