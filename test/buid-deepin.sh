#!/bin/bash
root_dir=$(cd `dirname $0`/.. && pwd -P)
cd $root_dir
export NO_WINE=false
docker-compose up
$root_dir/tools/build-deepin.sh $@

export NO_WINE=true
$root_dir/tools/fix-core.sh
$root_dir/tools/fix-other.sh
$root_dir/tools/build-deepin.sh $@