#!/bin/bash

root_dir=$(cd "$(dirname "$0")/.." && pwd -P)
cd $root_dir/resources

type=$1

if [ "$type" == "pack" ];then
    echo "正在打包asar文件..."
    npx asar pack app app.asar --unpack \
      "{**/bin/**,**/js/unpack/**,**/js/common/fileutils/unpack/**,**/js/common/cli/index.js,**/js/common/cli/skill-error-rules.js,**/js/common/cli/skill-index.js,**/js/common/cli/skill-outcome.js,**/js/common/cloud-functions-debugger-server/worker/node.js,**/js/common/miniprogram-builder/static/scripts/assetsCar/**,**/js/common/miniprogram-builder/static/scripts/checkXcodeEnv,**/js/common/miniprogram-builder/static/scripts/resignIpa,**/wechatide-skill/**,**/*.node,**/*.exe,**/*.dll,**/*.so,**/ios-deploy,**/node_modules/trash/lib/macos-trash,**/node_modules/skyline-addon/**,**/node_modules/wcc-exec/**,**/ripgrep/bin/**,package.json}"
    rm -rf app
elif [ "$type" == "unpack" ];then
    echo "正在解包asar文件..."
    npx asar extract app.asar app
    rm -rf app.asar app.asar.unpacked

    # asar 不会在 header 中为 unpacked 文件记录 executable 标记，
    # extract 重建出来的文件统一是 0644（如 wcc-exec/wcc、ripgrep/bin/rg）。
    # 若不补回 +x，下面重新 pack 时 0644 会被 copyFile 固化进 app.asar.unpacked。
    # 这里把 ELF 二进制和 shebang 脚本的执行权限补回来。
    find "$root_dir/resources/app" -type f ! -perm -u+x -print0 | xargs -0 -r -n 100 sh -c '
        for f do
            magic=$(od -An -tx1 -N4 "$f" | tr -d " \n")
            case "$magic" in
                7f454c46|2321*) chmod +x "$f" ;;  # ELF 二进制 / #! 脚本
            esac
        done
    ' sh
else
    echo "用法: $0 [pack|unpack]"
    exit 1
fi
