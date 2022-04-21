#!/bin/bash
set -e
root_dir=$(cd `dirname $0`/.. && pwd -P)
cd $root_dir
snapcraft #--http-proxy="http://192.168.1.232:7890" --https-proxy="http://192.168.1.232:7890"
snap install wechat-devtools_*_amd64.snap --devmode
# snap run wechat-devtools
