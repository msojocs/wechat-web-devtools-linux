#!/bin/bash

root_dir=$(cd `dirname $0`/.. && pwd -P)
BUILD_VERSION=$1

cd $root_dir/res/deb
pwd
# docker-compose down
docker-compose up