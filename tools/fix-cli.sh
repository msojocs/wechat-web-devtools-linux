#! /bin/bash

set -e
root_dir=$(cd `dirname $0`/.. && pwd -P)
NW_PACKAGE_DIR="$root_dir/package.nw"

if [ -z "$NW_PACKAGE_DIR" ]; then
    echo -e "\e[1;31m\$NW_PACKAGE_DIR is empty\e[0m" >&2
    exit 1
fi

cd "$NW_PACKAGE_DIR"

cd $root_dir/package.nw/js/common/cli
cat $root_dir/res/scripts/cli.js > temp.js
cat index.js >> temp.js
rm index.js
mv temp.js index.js