#! /bin/bash

set -e
root_dir=$(cd `dirname $0`/.. && pwd -P)
PACKAGE_DIR="$root_dir/resources/app.asar.unpacked"

if [ -z "$PACKAGE_DIR" ]; then
    echo -e "\e[1;31m\$PACKAGE_DIR is empty\e[0m" >&2
    exit 1
fi

cd $PACKAGE_DIR/js/common/cli
cat $root_dir/res/scripts/cli.js > temp.js
cat index.js >> temp.js
rm index.js
mv temp.js index.js