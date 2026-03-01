#!/bin/bash
# 参数：
# 1 ---- NW版本

set -ex

# ─────────────────────────────────────────
# 工具函数
# ─────────────────────────────────────────

notice() {
  echo -e "\033[36m $1 \033[0m "
}

fail() {
  echo -e "\033[41;37m 失败 \033[0m $1"
}

# ─────────────────────────────────────────
# 交叉编译判断与环境初始化
# ─────────────────────────────────────────

# 判断是否为 x86_64 → loongarch64 交叉编译
is_loong64_cross() {
  [ "$arch" == "loongarch64" ] && [ "$(uname -m)" == "x86_64" ]
}

# 判断是否为 x86_64 → arm64 交叉编译
is_arm64_cross() {
  [ "$arch" == "arm64" ] && [ "$(uname -m)" == "x86_64" ]
}

# 判断是否处于任意交叉编译模式（在 setup_cross_compile 之后调用才有效）
is_cross_compile() {
  [ -n "${GNU_TRIPLET:-}" ]
}

# 初始化交叉编译工具链环境变量
# 成功后会设置全局变量：GNU_TRIPLET, CROSS_SYSROOT
setup_cross_compile() {
  GNU_TRIPLET=""
  CROSS_SYSROOT=""
  local cross_inc cross_ldflags

  if is_loong64_cross; then
    notice "在x86构建龙架构，准备交叉编译"
    GNU_TRIPLET="loongarch64-unknown-linux-gnu"
    CROSS_SYSROOT="$root_dir/cache/cross-tools/target"
    cross_inc="-I${CROSS_SYSROOT}/usr/include -I${CROSS_SYSROOT}/usr/include/loongarch64-linux-gnu"
    cross_ldflags="-L${CROSS_SYSROOT}/usr/lib64 -L${CROSS_SYSROOT}/usr/lib/loongarch64-linux-gnu"
    export PATH="${CROSS_SYSROOT}/usr/bin:$root_dir/cache/cross-tools/${GNU_TRIPLET}/bin:$root_dir/cache/cross-tools/bin:$PATH"
    "$root_dir/tools/cross/toolchain-prepare-loong64.sh"
  elif is_arm64_cross; then
    notice "在x86构建arm64，准备交叉编译"
    GNU_TRIPLET="aarch64-linux-gnu"
    CROSS_SYSROOT="$root_dir/cache/cross-tools-arm64/target"
    cross_inc="-I${CROSS_SYSROOT}/usr/include -I${CROSS_SYSROOT}/usr/include/aarch64-linux-gnu"
    cross_ldflags="-L${CROSS_SYSROOT}/usr/lib/aarch64-linux-gnu"
    export PATH="${CROSS_SYSROOT}/usr/bin:$PATH"
    "$root_dir/tools/cross/toolchain-prepare-arm64.sh"
  fi

  if is_cross_compile; then
    export CC="${GNU_TRIPLET}-gcc"
    export CXX="${GNU_TRIPLET}-g++"
    export AR="${GNU_TRIPLET}-ar"
    export LINK="${GNU_TRIPLET}-g++"
    export RANLIB="${GNU_TRIPLET}-ranlib"
    export CFLAGS="$cross_inc"
    export CXXFLAGS="$cross_inc"
    export LDFLAGS="$cross_ldflags"
  fi
}

# ─────────────────────────────────────────
# 构建辅助函数
# ─────────────────────────────────────────

# node-gyp configure + build（在子目录内运行）
node_gyp_build() {
  local dir="$1"
  notice "Build $dir (node-gyp)"
  pushd "$dir"
  node-gyp configure "${configure_args[@]}"
  node-gyp build
  popd
}

# nw-gyp rebuild（在子目录内运行）
nw_gyp_build() {
  local dir="$1"
  notice "Build $dir (nw-gyp)"
  pushd "$dir"
  nw-gyp rebuild --arch="$arch" "--target=$NW_VERSION"
  popd
}

# 在临时叠加 loongarch64 C 兼容标志的子环境中执行任意命令
# 用法：with_loong64_cflags <cmd> [args...]
with_loong64_cflags() {
  (
    if is_loong64_cross; then
      export CFLAGS="$CFLAGS -x c -std=gnu89 -Wno-error=incompatible-pointer-types -Wno-incompatible-pointer-types"
      export CXXFLAGS="$CXXFLAGS -Wno-error=incompatible-pointer-types -Wno-incompatible-pointer-types"
    fi
    "$@"
  )
}

# ─────────────────────────────────────────
# 模块特定构建函数
# ─────────────────────────────────────────

build_nodegit() {
  notice "Build nodegit"
  pushd nodegit
  node-gyp configure "${configure_args[@]}"
  # 交叉编译时需要为 libssh2 的 configure 脚本传入 --host，否则 libssh2 会误判为宿主机架构
  if is_cross_compile; then
    sed -i "s#libssh2ConfigureScript,#\`\${libssh2ConfigureScript} --host=${GNU_TRIPLET}\`,#" \
      utils/configureLibssh2.js
  fi
  node-gyp build
  rm -rf .github include src lifecycleScripts vendor utils build/vendor build/Release/.deps
  popd
}

# oniguruma 既作为 nwjs 模块（oniguruma），又作为 node 模块（oniguruma-node）
build_oniguruma() {
  cp -fr oniguruma oniguruma-node

  # node 版本：loongarch64 交叉编译需要额外的 C 兼容性标志
  with_loong64_cflags node_gyp_build "oniguruma-node"

  # nwjs 版本
  nw_gyp_build "oniguruma"
}

# ─────────────────────────────────────────
# 主流程
# ─────────────────────────────────────────

root_dir=$(cd "$(dirname "$0")/.." && pwd -P)
package_dir="$root_dir/package.nw"

if [ -n "$1" ]; then
  NW_VERSION=$1
fi
if [ -z "$NW_VERSION" ]; then
  echo "NW 版本未指定！"
  exit 1
fi

# TODO: 兼容python2.7的命令
PY_VERSION=$(python -V 2>&1 | awk '{print $2}' | awk -F '.' '{print $1}')
if [ "$PY_VERSION" != "2" ]; then
  hash python2.7 2>/dev/null || hash python2 2>/dev/null || {
    fail "I require python2 but it's not installed.  Aborting."
    exit 1
  }
  mkdir -p "$root_dir/tmp/bin"
  if hash python2.7 2>/dev/null; then
    ln -sf "$(which python2.7)" "$root_dir/tmp/bin/python"
  else
    ln -sf "$(which python2)" "$root_dir/tmp/bin/python"
  fi
fi

hash nw-gyp 2>/dev/null || {
  echo "=======请安装nw-gyp======="
  exit 1
}

arch=$(node "$root_dir/tools/parse-config.js" --get-arch "$@")
setup_cross_compile

echo -e "\033[42;37m ######## 版本信息 $(date '+%Y-%m-%d %H:%M:%S') ########\033[0m"
echo "NW VERSION:       $NW_VERSION"
echo "arch:             $arch"
echo "nw-gyp version:   $(nw-gyp --version)"
echo "node version:     $(node --version)"
echo "npm version:      $(npm --version)"
python --version
python3 --version

# ── Windows 专属模块清理 ──────────────────
cd "${package_dir}/node_modules"
rm -fr vscode-windows-ca-certs \
     vscode-windows-registry \
     vscode-windows-registry-node \
     windows-process-tree
find -name "*.pdb" | xargs -I{} rm -rf {}
find -name "*.lib" | xargs -I{} rm -rf {}
find -name "*.dll" | xargs -I{} rm -rf {}

# ── ripgrep 二进制替换 ────────────────────
# https://github.com/microsoft/ripgrep-prebuilt
ripgrep_version="15.0.0"
case "$arch" in
  arm64)
    ripgrep_triple="aarch64-unknown-linux-musl" ;;
  loongarch64)
    # TODO: 等待上游提供 loongarch64 预编译版本，暂用 x86_64
    ripgrep_triple="x86_64-unknown-linux-musl" ;;
  *)
    ripgrep_triple="x86_64-unknown-linux-musl" ;;
esac
ripgrep_tarball="ripgrep-v${ripgrep_version}-${ripgrep_triple}.tar.gz"
ripgrep_path="$root_dir/cache/$ripgrep_tarball"
mkdir -p "$root_dir/cache"

if [ ! -f "$ripgrep_path" ]; then
  wget "https://github.com/microsoft/ripgrep-prebuilt/releases/download/v${ripgrep_version}/${ripgrep_tarball}" \
    -O "${ripgrep_path}.tmp"
  mv "${ripgrep_path}.tmp" "$ripgrep_path"
fi

rm -fr "${package_dir}/node_modules/@vscode/ripgrep/bin/"*
mkdir -p "${package_dir}/node_modules/@vscode/ripgrep/tmp"
tar xvf "$ripgrep_path" -C "${package_dir}/node_modules/@vscode/ripgrep/bin"
rm -rf "${package_dir}/node_modules/@vscode/ripgrep/tmp"

# ── 安装待重编译的模块源码 ───────────────
rm -fr "${package_dir}/node_modules_tmp"
mkdir -p "${package_dir}/node_modules_tmp/node_modules"

notice "install modules"
export JOBS=$(nproc)
(
  cd "${package_dir}/node_modules_tmp"
  npm install \
    extract-file-icon \
    native-keymap \
    node-pty@1.0.0 \
    native-watchdog \
    oniguruma \
    @vscode/spdlog@0.13.11 \
    nodegit \
    @vscode/sqlite3 \
    --ignore-scripts \
    --registry=https://registry.npmmirror.com \
    --nodegit_binary_host_mirror=https://npmmirror.com/mirrors/nodegit/v0.27.0/
)

# ── 逐模块重编译 ──────────────────────────
# 注：每个模块单独 rebuild，交叉编译时可能需要单独调整配置。
# 关于 nw-gyp vs node-gyp：
#   运行在 nwjs 进程中的模块用 nw-gyp，运行在 node 进程中的用 node-gyp。
#   可在 js 层打印 `process.versions` 来确认当前环境。

cd "${package_dir}/node_modules_tmp/node_modules"

node_version=$(node "$root_dir/tools/parse-config.js" --get-node-version "$@")
configure_args=(
  --target_platform=linux
  --target_arch="$arch"
  --verbose --host
  --target="v$node_version"
  --registry=https://registry.npmmirror.com
)

build_nodegit
node_gyp_build "extract-file-icon"
node_gyp_build "native-keymap"
node_gyp_build "node-pty"       # node build
nw_gyp_build   "native-watchdog"  # nwjs build，不需要 node 版本号

build_oniguruma

# @vscode/spdlog: nwjs 用 spdlog18（node v18 ABI），node 用原目录
cp -fr "@vscode/spdlog" "@vscode/spdlog18"
node_gyp_build "@vscode/spdlog18"

(cd "@vscode" && node_gyp_build "sqlite3")

# ── 清理编译产物冗余文件 ─────────────────
notice "remove unused files"
find . -name ".deps" | xargs -I{} rm -rf {}
find . -name "obj.target" | xargs -I{} rm -rf {}
find . -name "*.a" | xargs -I{} rm -f {}
find . -name "*.lib" -delete
find . -name "*..mk" -delete

# ── 将 .node 文件回写到 package.nw ───────
notice "copy node files"
find . -name "*.node" | xargs -I{} cp -rf {} "${package_dir}/node_modules/{}"

rm -rf "${package_dir}/node_modules_tmp"
