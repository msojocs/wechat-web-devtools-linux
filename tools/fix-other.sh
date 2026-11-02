#!/bin/bash
root_dir=$(cd `dirname $0`/.. && pwd -P)
source "$root_dir/tools/error-handler.sh"
devtools_enable_error_trap
set -ex
srcdir=$root_dir
tmp_dir="$root_dir/tmp"
package_dir="$root_dir/resources/app.asar.unpacked"

# 修复mock按钮无反应
# sed -i '1s/^/window.prompt = parent.prompt;\n/' "${package_dir}/js/ideplugin/devtools/index.js"

# Skyline解析插件修复
# 按目标架构选择浮点着色器 napi 资产：arm64 → linux-arm64-gnu；loongarch64 上游无产物，回退 x64。
float_pigment_version="continuous"
_fp_arch=$(node "$root_dir/tools/parse-config.js" --get-arch "$@")
case "$_fp_arch" in
  arm64)       float_pigment_target="linux-arm64-gnu" ;;
  loongarch64) float_pigment_target="linux-x64-gnu" ;;
  *)           float_pigment_target="linux-x64-gnu" ;;
esac
float_pigment_file="float-pigment-${float_pigment_version}-${float_pigment_target}.node"
if [ ! -f "${srcdir}/cache/${float_pigment_file}" ];then
  wget -c "https://github.com/msojocs/float-pigment-rust/releases/download/${float_pigment_version}/float-pigment.${float_pigment_target}.node" -O "${srcdir}/cache/${float_pigment_file}.tmp"
  mv "${srcdir}/cache/${float_pigment_file}.tmp" "${srcdir}/cache/${float_pigment_file}"
fi
rm -f "${package_dir}/node_modules/node-float-pigment-css/float-pigment-css-for-nodejs.node" "${package_dir}/node_modules/node-float-pigment-css/float-pigment-css-for-nwjs.node"
cp "${srcdir}/cache/${float_pigment_file}" "${package_dir}/node_modules/node-float-pigment-css/float-pigment-css-for-nodejs.node"
cp "${srcdir}/cache/${float_pigment_file}" "${package_dir}/node_modules/node-float-pigment-css/float-pigment-css-for-nwjs.node"

# websocket找不到
# cd "${package_dir}/js/libs/vseditor/extensions/node_modules/ws/lib"
# if [ -f "WebSocket.js" ];then
#   mv "WebSocket.js" "websocket.js"
#   mv "Receiver.js" "receiver.js"
#   mv "Sender.js" "sender.js"
#   mv "Constants.js" "constants.js"
#   mv "Validation.js" "validation.js"
# fi

# 阻止无限启动服务器
# mv "${package_dir}/js/core/entrance.js" "${package_dir}/js/core/entrance.js.bak"
# cat "${srcdir}/res/scripts/entrance.js" > "${package_dir}/js/core/entrance.js"
# cat "${package_dir}/js/core/entrance.js.bak" >> "${package_dir}/js/core/entrance.js"
# rm "${package_dir}/js/core/entrance.js.bak"

# 修复iframe导致的崩溃
# sed -i 's#"use strict";##' "${package_dir}/js/core/index.js"
# mv "${package_dir}/js/core/index.js" "${package_dir}/js/core/index.js.bak"
# cat "${srcdir}/res/scripts/core_index.js" > "${package_dir}/js/core/index.js"
# cat "${package_dir}/js/core/index.js.bak" >> "${package_dir}/js/core/index.js"
# rm "${package_dir}/js/core/index.js.bak"

# 修复编辑器不能覆盖粘贴
# sed -i 's#if(super(),l.isLinux){let#if(super(),l.isLinux){return;let#' "${package_dir}/js/libs/vseditor/bundled/editor.bundled.js"

current=`date "+%Y-%m-%d %H:%M:%S"`
timeStamp=`date -d "$current" +%s`
echo $timeStamp > "${package_dir}/.build_time"


rm -rf "$tmp_dir/node_modules"
