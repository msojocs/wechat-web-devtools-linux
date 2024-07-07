#!/bin/bash
set -ex
root_dir=$(cd `dirname $0`/.. && pwd -P)
srcdir=$root_dir
tmp_dir="$root_dir/tmp"
package_dir="$root_dir/package.nw"

# 修复: webview manager
# 此bug导致以下功能异常: 
# 1. 代码依赖分析不可用
# 2. 拓展中的“SERVICE MARKET RECOMMENDS”功能不可用
echo "fix: webview manager"
sed -i 's#module.exports = createWebviewManager;#module.exports = createWebviewManager,( /** @type {any} */ (window)).createWebviewManager = createWebviewManager;#g' "$package_dir/js/libs/vseditor/webview-resource/main.js"

echo "replace: wcc,wcsc linux version"
source "${srcdir}/conf/compiler_version"

mkdir -p "${srcdir}/cache/compiler/${WX_COMPILER_VERSION}"
if [ ! -f "${srcdir}/cache/compiler/${WX_COMPILER_VERSION}/wcc" ];then
  wget -c "https://github.com/msojocs/wx-compiler/releases/download/${WX_COMPILER_VERSION}/wcc" -O "${srcdir}/cache/compiler/${WX_COMPILER_VERSION}/wcc.tmp"
  mv "${srcdir}/cache/compiler/${WX_COMPILER_VERSION}/wcc.tmp" "${srcdir}/cache/compiler/${WX_COMPILER_VERSION}/wcc"
  chmod 0755 "${srcdir}/cache/compiler/${WX_COMPILER_VERSION}/wcc"
fi

if [ ! -f "${srcdir}/cache/compiler/${WX_COMPILER_VERSION}/wcsc" ];then
  wget -c "https://github.com/msojocs/wx-compiler/releases/download/${WX_COMPILER_VERSION}/wcsc" -O "${srcdir}/cache/compiler/${WX_COMPILER_VERSION}/wcsc.tmp"
  mv "${srcdir}/cache/compiler/${WX_COMPILER_VERSION}/wcsc.tmp" "${srcdir}/cache/compiler/${WX_COMPILER_VERSION}/wcsc"
  chmod 0755 "${srcdir}/cache/compiler/${WX_COMPILER_VERSION}/wcsc"
fi

if [ ! -f "${srcdir}/cache/compiler/${WX_COMPILER_VERSION}/wcc_module.node" ];then
  wget -c "https://github.com/msojocs/wx-compiler/releases/download/${WX_COMPILER_VERSION}/wcc_module.node" -O "${srcdir}/cache/compiler/${WX_COMPILER_VERSION}/wcc_module.node.tmp"
  mv "${srcdir}/cache/compiler/${WX_COMPILER_VERSION}/wcc_module.node.tmp" "${srcdir}/cache/compiler/${WX_COMPILER_VERSION}/wcc_module.node"
  chmod 0755 "${srcdir}/cache/compiler/${WX_COMPILER_VERSION}/wcc_module.node"
fi

if [ ! -f "${srcdir}/cache/compiler/${WX_COMPILER_VERSION}/wcsc_module.node" ];then
  wget -c "https://github.com/msojocs/wx-compiler/releases/download/${WX_COMPILER_VERSION}/wcsc_module.node" -O "${srcdir}/cache/compiler/${WX_COMPILER_VERSION}/wcsc_module.node.tmp"
  mv "${srcdir}/cache/compiler/${WX_COMPILER_VERSION}/wcsc_module.node.tmp" "${srcdir}/cache/compiler/${WX_COMPILER_VERSION}/wcsc_module.node"
  chmod 0755 "${srcdir}/cache/compiler/${WX_COMPILER_VERSION}/wcsc_module.node"
fi

# \cp -rf "${srcdir}/compiler/generatemd5.js" "${package_dir}/js/vendor/generatemd5.js"
\cp "${srcdir}/cache/compiler/${WX_COMPILER_VERSION}"/{wcc,wcsc} "${package_dir}/node_modules/wcc-exec"
cd "${package_dir}/node_modules/wcc-exec" && chmod 0755 wcc wcsc && rm -rf wcc.exe wcsc.exe
# node "${package_dir}/js/vendor/generatemd5.js"

# 修复：可视化用的wcc,wcsc
echo "fix: wcc,wcsc"
\cp "${srcdir}/cache/compiler/${WX_COMPILER_VERSION}"/wcc_module.node "${package_dir}/node_modules/wcc/build/Release"
cd "${package_dir}/node_modules/wcc/build/Release" && rm -rf wcc.node && mv wcc_module.node wcc.node
\cp "${srcdir}/cache/compiler/${WX_COMPILER_VERSION}"/wcsc_module.node "${package_dir}/node_modules/wcc/build/Release"
cd "${package_dir}/node_modules/wcc/build/Release" && rm -rf wcsc.node && mv wcsc_module.node wcsc.node

current=`date "+%Y-%m-%d %H:%M:%S"`
timeStamp=`date -d "$current" +%s`
echo $timeStamp > "${package_dir}/.build_time"


rm -rf "$tmp_dir/node_modules"