#!/bin/bash

root_dir=$(cd "$(dirname "$0")/.." && pwd -P)
cd $root_dir/resources

type=$1

if [ "$type" == "pack" ];then
    echo "正在打包asar文件..."
    npx asar pack app app.asar --unpack "{**/package.json,**/bin/**,**/js/unpack/**,**/js/common/fileutils/unpack/**,**/js/common/cli/index.js,**/*.node,**/*.exe,**/*.dll,**/*.so,**/ios-deploy,**/node_modules/trash/lib/macos-trash,**/node_modules/skyline-addon/**}"
elif [ "$type" == "unpack" ];then
    echo "正在解包asar文件..."
    npx asar extract app.asar app
else
    echo "用法: $0 [pack|unpack]"
    exit 1
fi