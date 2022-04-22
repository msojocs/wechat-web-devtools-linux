#!/bin/bash
set -e
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

# 修复：可视化用的wcc,wcsc
echo "fix: wcc,wcsc"
if [[ ! -d "$tmp_dir/node_modules" ]];then
  mkdir -p "$tmp_dir/node_modules"
fi
cd $tmp_dir && npm install miniprogram-compiler
# wcc wcsc
# 可视化编译
(cd "${package_dir}/node_modules/" \
&& rm -rf wcc wcsc \
&& mkdir -p "wcc/bin/linux" \
&& cp -r "${tmp_dir}/node_modules/miniprogram-compiler/bin/linux/wcc" "wcc/bin/linux/wcc" \
&& cp -r "${tmp_dir}/node_modules/miniprogram-compiler/bin/linux/wcsc" "wcc/bin/linux/wcsc" \
&& chmod 0755 "wcc/bin/linux/wcc" "wcc/bin/linux/wcsc" \
&& cp -r "${srcdir}/compiler/wcc_node"/* "wcc" 
)

# 预览编译，设置NO_WINE=true环境变量生效
# 如果是mac执行wcc,否则wcc.exe
if [[ $NO_WINE == 'true' ]];then
  \cp -rf "${srcdir}/compiler/generatemd5.js" "${package_dir}/js/vendor/generatemd5.js"
  \cp -rf "${srcdir}/compiler/nodejs/wcc" "${package_dir}/js/vendor/wcc"
  \cp -rf "${srcdir}/compiler/nodejs/wcsc" "${package_dir}/js/vendor/wcsc"
  \cp -rf "${tmp_dir}/node_modules/miniprogram-compiler/bin/linux/wcc" "${package_dir}/js/vendor/wcc.bin"
  \cp -rf "${tmp_dir}/node_modules/miniprogram-compiler/bin/linux/wcsc" "${package_dir}/js/vendor/wcsc.bin"
  cd "${package_dir}/js/vendor" && chmod 0755 wcc wcsc wcc.bin wcsc.bin
  node "${package_dir}/js/vendor/generatemd5.js"

  current=`date "+%Y-%m-%d %H:%M:%S"`
  timeStamp=`date -d "$current" +%s`
  echo $timeStamp > "${package_dir}/.build_time"
fi

rm -rf "$tmp_dir/node_modules"