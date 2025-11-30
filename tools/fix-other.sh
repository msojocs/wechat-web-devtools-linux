#!/bin/bash
set -ex
root_dir=$(cd `dirname $0`/.. && pwd -P)
srcdir=$root_dir
tmp_dir="$root_dir/tmp"
nwjs_dir="$root_dir/nwjs"
package_dir="$root_dir/package.nw"

echo "replace: wcc,wcsc linux version"
compiler_version=$(node "$root_dir/tools/parse-config.js" --get-compiler-version $@)
arch=$(node "$root_dir/tools/parse-config.js" --get-arch $@)
if [ "$arch" == "x64" ];then
  arch="x86_64"
fi

mkdir -p "${srcdir}/cache/compiler/v${compiler_version}"
if [ ! -f "${srcdir}/cache/compiler/v${compiler_version}/wcc-${arch}" ];then
  wget -c "https://github.com/msojocs/wx-compiler/releases/download/v${compiler_version}/wcc-${arch}" -O "${srcdir}/cache/compiler/v${compiler_version}/wcc-${arch}.tmp"
  mv "${srcdir}/cache/compiler/v${compiler_version}/wcc-${arch}.tmp" "${srcdir}/cache/compiler/v${compiler_version}/wcc-${arch}"
  chmod +x "${srcdir}/cache/compiler/v${compiler_version}/wcc-${arch}"
fi

if [ ! -f "${srcdir}/cache/compiler/v${compiler_version}/wcsc-${arch}" ];then
  wget -c "https://github.com/msojocs/wx-compiler/releases/download/v${compiler_version}/wcsc-${arch}" -O "${srcdir}/cache/compiler/v${compiler_version}/wcsc-${arch}.tmp"
  mv "${srcdir}/cache/compiler/v${compiler_version}/wcsc-${arch}.tmp" "${srcdir}/cache/compiler/v${compiler_version}/wcsc-${arch}"
  chmod +x "${srcdir}/cache/compiler/v${compiler_version}/wcsc-${arch}"
fi

if [ ! -f "${srcdir}/cache/compiler/v${compiler_version}/wcc-${arch}.node" ];then
  wget -c "https://github.com/msojocs/wx-compiler/releases/download/v${compiler_version}/wcc-${arch}.node" -O "${srcdir}/cache/compiler/v${compiler_version}/wcc-${arch}.node.tmp"
  mv "${srcdir}/cache/compiler/v${compiler_version}/wcc-${arch}.node.tmp" "${srcdir}/cache/compiler/v${compiler_version}/wcc-${arch}.node"
fi

if [ ! -f "${srcdir}/cache/compiler/v${compiler_version}/wcsc-${arch}.node" ];then
  wget -c "https://github.com/msojocs/wx-compiler/releases/download/v${compiler_version}/wcsc-${arch}.node" -O "${srcdir}/cache/compiler/v${compiler_version}/wcsc-${arch}.node.tmp"
  mv "${srcdir}/cache/compiler/v${compiler_version}/wcsc-${arch}.node.tmp" "${srcdir}/cache/compiler/v${compiler_version}/wcsc-${arch}.node"
fi

cp "${srcdir}/cache/compiler/v${compiler_version}"/wcc-${arch} "${package_dir}/node_modules/wcc-exec/wcc"
cp "${srcdir}/cache/compiler/v${compiler_version}"/wcsc-${arch} "${package_dir}/node_modules/wcc-exec/wcsc"
cd "${package_dir}/node_modules/wcc-exec" && chmod +x wcc wcsc && rm -rf wcc.exe wcsc.exe

# 修复：可视化用的wcc,wcsc
echo "fix: wcc,wcsc"
\cp "${srcdir}/cache/compiler/v${compiler_version}"/wcc-${arch}.node "${package_dir}/node_modules/wcc/build/Release"
cd "${package_dir}/node_modules/wcc/build/Release" && rm -rf wcc.node && mv wcc-${arch}.node wcc.node
\cp "${srcdir}/cache/compiler/v${compiler_version}"/wcsc-${arch}.node "${package_dir}/node_modules/wcc/build/Release"
cd "${package_dir}/node_modules/wcc/build/Release" && rm -rf wcsc.node && mv wcsc-${arch}.node wcsc.node

# 修复mock按钮无反应
sed -i '1s/^/window.prompt = parent.prompt;\n/' "${package_dir}/js/ideplugin/devtools/index.js"

nw_version=$(node "$root_dir/tools/parse-config.js" --get-nwjs-version $@)
# 修复视频无法播放
if [ ! -f "${srcdir}/cache/libffmpeg-${nw_version}-linux-x64.zip" ];then
  wget -c https://github.com/nwjs-ffmpeg-prebuilt/nwjs-ffmpeg-prebuilt/releases/download/${nw_version}/${nw_version}-linux-x64.zip -O "${srcdir}/cache/libffmpeg-${nw_version}-linux-x64.zip.tmp"
  mv "${srcdir}/cache/libffmpeg-${nw_version}-linux-x64.zip.tmp" "${srcdir}/cache/libffmpeg-${nw_version}-linux-x64.zip"
fi
rm -rf "${nwjs_dir}/lib/libffmpeg.so"
unzip "${srcdir}/cache/libffmpeg-${nw_version}-linux-x64.zip" -d "${nwjs_dir}/lib"

# Skyline解析插件修复
float_pigment_version="continuous"
if [ ! -f "${srcdir}/cache/float-pigment-${float_pigment_version}.node" ];then
  wget -c "https://github.com/msojocs/float-pigment-rust/releases/download/${float_pigment_version}/float-pigment.linux-x64-gnu.node" -O "${srcdir}/cache/float-pigment-${float_pigment_version}.node.tmp"
  mv "${srcdir}/cache/float-pigment-${float_pigment_version}.node.tmp" "${srcdir}/cache/float-pigment-${float_pigment_version}.node"
fi
rm "${package_dir}/node_modules/node-float-pigment-css/float-pigment-css-for-nodejs.node" "${package_dir}/node_modules/node-float-pigment-css/float-pigment-css-for-nwjs.node"
cp "${srcdir}/cache/float-pigment-${float_pigment_version}.node" "${package_dir}/node_modules/node-float-pigment-css/float-pigment-css-for-nodejs.node"
cp "${srcdir}/cache/float-pigment-${float_pigment_version}.node" "${package_dir}/node_modules/node-float-pigment-css/float-pigment-css-for-nwjs.node"

# websocket找不到
cd "${package_dir}/js/libs/vseditor/extensions/node_modules/ws/lib"
mv "WebSocket.js" "websocket.js"
mv "Receiver.js" "receiver.js"
mv "Sender.js" "sender.js"
mv "Constants.js" "constants.js"
mv "Validation.js" "validation.js"

# 阻止无限启动服务器
mv "${package_dir}/js/core/entrance.js" "${package_dir}/js/core/entrance.js.bak"
cat "${srcdir}/res/scripts/entrance.js" > "${package_dir}/js/core/entrance.js"
cat "${package_dir}/js/core/entrance.js.bak" >> "${package_dir}/js/core/entrance.js"
rm "${package_dir}/js/core/entrance.js.bak"

current=`date "+%Y-%m-%d %H:%M:%S"`
timeStamp=`date -d "$current" +%s`
echo $timeStamp > "${package_dir}/.build_time"


rm -rf "$tmp_dir/node_modules"