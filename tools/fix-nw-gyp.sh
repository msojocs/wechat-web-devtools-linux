#! /bin/bash

# from https://github.com/nwjs/nw-gyp/issues/155#issuecomment-1308701166

gyp_path=$(readlink -f "$(which nw-gyp)")
module_path=$(cd `dirname $gyp_path`/.. && pwd -P)
config_file="${module_path}/lib/configure.js"
echo "fix configure file: $config_file"
sed -i "s#process.config || {}#JSON.parse(JSON.stringify(process.config)) || {}#" "$config_file"