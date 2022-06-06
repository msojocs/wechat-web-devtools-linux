#!/bin/bash
root_dir=$(cd `dirname $0`/.. && pwd -P)
cd $root_dir
export WINE=true
docker-compose up
$root_dir/tools/build-deepin.sh $@

export WINE=false
$root_dir/tools/fix-core.sh
$root_dir/tools/fix-other.sh
$root_dir/tools/build-deepin.sh $@