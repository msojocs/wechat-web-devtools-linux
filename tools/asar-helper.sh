#!/bin/bash

root_dir=$(cd "$(dirname "$0")/.." && pwd -P)
cd $root_dir/resources

type=$1

if [ "$type" == "pack" ];then
    echo "正在打包asar文件..."
    npx asar pack app app.asar --unpack \
      "{**/bin/**,**/js/unpack/**,**/js/common/fileutils/unpack/**,**/js/common/cli/index.js,**/js/common/cli/skill-error-rules.js,**/js/common/cli/skill-index.js,**/js/common/cli/skill-outcome.js,**/js/common/cloud-functions-debugger-server/worker/node.js,**/js/common/miniprogram-builder/static/scripts/assetsCar/**,**/js/common/miniprogram-builder/static/scripts/checkXcodeEnv,**/js/common/miniprogram-builder/static/scripts/resignIpa,**/wechatide-skill/**,**/*.node,**/*.exe,**/*.dll,**/*.so,**/ios-deploy,**/node_modules/trash/lib/macos-trash,**/node_modules/skyline-addon/**,**/node_modules/wcc-exec/**,**/ripgrep/bin/**,package.json}"
    # asar extract 不会保留可执行位，unpack 后再 pack 会把 unpacked 文件写成 0644。
    # 编译器的 wcc/wcsc 必须可执行，而 fix-compiler.sh 里的 chmod 会被后续的
    # fix-data-path.sh 等 unpack/pack 覆盖，因此在每次打包后统一补回。
    for compiler in wcc wcsc; do
      target="app.asar.unpacked/node_modules/wcc-exec/$compiler"
      [ -f "$target" ] && chmod +x "$target"
    done
    rm -rf app
elif [ "$type" == "unpack" ];then
    echo "正在解包asar文件..."
    npx asar extract app.asar app
    rm -rf app.asar app.asar.unpacked
else
    echo "用法: $0 [pack|unpack]"
    exit 1
fi
