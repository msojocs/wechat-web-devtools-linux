#! /bin/bash

set -e

warn() {
    echo -e "\033[43;37m 警告 \033[0m $1"
}
root_dir=$(cd `dirname $0`/.. && pwd -P)

srcdir=$root_dir
package_dir="$root_dir/resources/app"


$root_dir/tools/asar-helper.sh unpack

cd "$package_dir"

apply_prepend_patch() {
    local target_file="$1"
    local patch_file="$2"

    if [ ! -f "$target_file" ]; then
        echo -e "\e[1;31m$target_file is not exist\e[0m" >&2
        $root_dir/tools/asar-helper.sh pack
        exit 1
    fi

    if [ ! -f "$patch_file" ]; then
        echo -e "\e[1;31m$patch_file is not exist\e[0m" >&2
        $root_dir/tools/asar-helper.sh pack
        exit 1
    fi

    local patch_size=$(wc -c < "$patch_file")
    if cmp -s -n "$patch_size" "$patch_file" "$target_file"; then
        echo "$target_file is already patched"
        return
    fi

    local tmp_file=$(mktemp)
    cat "$patch_file" "$target_file" > "$tmp_file"
    cat "$tmp_file" > "$target_file"
    rm "$tmp_file"
}

apply_prepend_patch "$package_dir/js/electron/backend/bootstrap.js" "$root_dir/res/scripts/bootstrap.js"
apply_prepend_patch "$package_dir/js/common/miniprogram-builder/modules/corecompiler/original/workerThread/config.js" "$root_dir/res/scripts/config.js"

# 修复：模拟器编译后首次点击无效
# Chromium 的鼠标模拟触摸层会丢掉会话内第一次点击的 touchend，而小程序的 tap 必须由
# touchstart + touchend 配对生成，缺了 touchend 就不产生 tap，bindtap 处理器不会被调用。
# 这里把补偿脚本前置到渲染层注入脚本（即 html/pageframe.html 引用的
# /__dev__/documentstart.js 所对应的文件）里。
apply_prepend_patch "$package_dir/js/extensions/inject/documentstart/index.js" "$root_dir/res/scripts/touch_first_click.js"

echo "replace: wcc,wcsc linux version"
compiler_version=$(node "$root_dir/tools/parse-config.js" --get-compiler-version $@)
arch=$(node "$root_dir/tools/parse-config.js" --get-arch $@)
if [ "$arch" == "x64" ];then
  arch="x86_64"
elif [ "$arch" == "loongarch64" ];then
  arch="loong64"
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
\cp "${srcdir}/cache/compiler/v${compiler_version}"/wcc-${arch}.node "${package_dir}/node_modules/wcc-electron/build/Release"
cd "${package_dir}/node_modules/wcc-electron/build/Release" && rm -rf wcc.node && mv wcc-${arch}.node wcc.node
\cp "${srcdir}/cache/compiler/v${compiler_version}"/wcsc-${arch}.node "${package_dir}/node_modules/wcc-electron/build/Release"
cd "${package_dir}/node_modules/wcc-electron/build/Release" && rm -rf wcsc.node && mv wcsc-${arch}.node wcsc.node

$root_dir/tools/asar-helper.sh pack