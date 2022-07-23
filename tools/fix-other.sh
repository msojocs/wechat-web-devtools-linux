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
# wcc wcsc
ls -l "${srcdir}/compiler"
# 可视化编译
(cd "${package_dir}/node_modules/" \
&& rm -rf wcc \
&& cp -rL "${srcdir}/compiler/wcc_node" "wcc" \
&& chmod +x wcc/bin/linux/*
)

# 预览编译，设置 WINE!=true 环境变量生效
# 如果是mac执行wcc,否则wcc.exe
if [[ "$WINE" != 'true' ]];then
  # \cp -rf "${srcdir}/compiler/generatemd5.js" "${package_dir}/js/vendor/generatemd5.js"
  \cp "${srcdir}/compiler/nodejs"/* "${package_dir}/node_modules/wcc-exec"
  cd "${package_dir}/node_modules/wcc-exec" && chmod 0755 wcc wcsc wcc.bin wcsc.bin
  # node "${package_dir}/js/vendor/generatemd5.js"

  current=`date "+%Y-%m-%d %H:%M:%S"`
  timeStamp=`date -d "$current" +%s`
  echo $timeStamp > "${package_dir}/.build_time"
fi

rm -rf "$tmp_dir/node_modules"