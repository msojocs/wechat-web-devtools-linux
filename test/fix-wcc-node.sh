#!/bin/bash
package_dir="/mnt/disk1/GitHub/wechat-devtools/package.nw"
cd "${package_dir}/node_modules/" \
&& rm -rf wcc wcsc \
&& mkdir -p "wcc/bin/linux" "wcsc/bin/linux" \
&& cp -r "${package_dir}/node_modules_tmp/node_modules/miniprogram-compiler/bin/linux/wcc" "wcc/bin/linux/wcc" \
&& cp -r "${package_dir}/node_modules_tmp/node_modules/miniprogram-compiler/bin/linux/wcsc" "wcsc/bin/linux/wcsc" \
&& cp -r "${package_dir}/../compiler/wcc_node"/* "wcc" \
&& cp -r "${package_dir}/../compiler/wcsc_node"/* "wcsc"