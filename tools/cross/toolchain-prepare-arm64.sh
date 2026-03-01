#!/bin/bash
# 为 x86_64 → arm64 交叉编译准备工具链与 sysroot
set -ex

root_dir=$(cd "$(dirname "$0")/../.." && pwd -P)

# ────────────────────────────────────────────
# 1. 检查系统交叉编译工具链
# ────────────────────────────────────────────
if ! command -v aarch64-linux-gnu-gcc &>/dev/null; then
    echo "错误：未找到 aarch64-linux-gnu-gcc。" >&2
    echo "请先安装：sudo apt install gcc-aarch64-linux-gnu g++-aarch64-linux-gnu" >&2
    exit 1
fi

# ────────────────────────────────────────────
# 2. 下载 sysroot（Debian bookworm arm64 包）
# ────────────────────────────────────────────
SYSROOT="$root_dir/cache/cross-tools-arm64/target"
mkdir -p "$SYSROOT"
mkdir -p "$root_dir/cache/pkg"
cd "$root_dir/cache/pkg"

BASE_DEBIAN="http://ftp.kr.debian.org/debian"
SUITE="bookworm"
COMPONENT="main"
DEB_ARCH="arm64"

function _index_path {
    local suite=$1
    local arch=$2
    echo "$root_dir/cache/pkg/Packages-debian-${suite}-${arch}.xz"
}

function _download_index {
    local suite=$1
    local arch=$2
    local index_path=$(_index_path "$suite" "$arch")
    local index_url="$BASE_DEBIAN/dists/$suite/$COMPONENT/binary-$arch/Packages.xz"
    if [ ! -f "$index_path" ]; then
        wget -c "$index_url" -O "$index_path"
    fi
}

function _find_filename_in_index {
    local pkg_name=$1
    local index_path=$2
    if [ ! -f "$index_path" ]; then
        return 1
    fi
    xzcat "$index_path" | awk -v pkg="$pkg_name" '
        $1=="Package:" {p=$2}
        $1=="Filename:" && p==pkg {print $2; exit}
    '
}

function _resolve_pkg_url {
    local pkg_name=$1
    local filename=""

    # 先查 arm64
    _download_index "$SUITE" "$DEB_ARCH"
    filename=$(_find_filename_in_index "$pkg_name" "$(_index_path "$SUITE" "$DEB_ARCH")")
    if [ -n "$filename" ]; then
        echo "$BASE_DEBIAN/$filename"
        return 0
    fi

    # 再查 arch-independent（all）
    _download_index "$SUITE" "all"
    filename=$(_find_filename_in_index "$pkg_name" "$(_index_path "$SUITE" "all")")
    if [ -n "$filename" ]; then
        echo "$BASE_DEBIAN/$filename"
        return 0
    fi

    return 1
}

function install_pkg {
    local pkg_name=$1
    local pkg_url
    pkg_url=$(_resolve_pkg_url "$pkg_name")
    if [ -z "$pkg_url" ]; then
        echo "Failed to resolve package URL for $pkg_name" >&2
        exit 1
    fi
    local pkg_file
    pkg_file=$(basename "$pkg_url")
    if [ ! -f "$pkg_file" ]; then
        wget -c "$pkg_url" -O "$pkg_file"
    fi
    dpkg -x "$pkg_file" "$SYSROOT"
}

install_pkg libx11-dev
install_pkg libxkbfile-dev
install_pkg x11proto-dev
install_pkg libx11-6
install_pkg libxkbfile1
install_pkg libkrb5-dev
install_pkg krb5-multidev
install_pkg openssl
install_pkg libssl-dev
install_pkg libssh2-1-dev
install_pkg libssh2-1
install_pkg zlib1g
install_pkg comerr-dev
install_pkg libkrb5-3
install_pkg libk5crypto3
install_pkg libgssapi-krb5-2
install_pkg libcom-err2

# ────────────────────────────────────────────
# 3. 安装 node-gyp 头文件
# ────────────────────────────────────────────
node-gyp install

# ────────────────────────────────────────────
# 4. 修复 krb5-config（输出正确的 arm64 链接参数）
# ────────────────────────────────────────────
mkdir -p "$SYSROOT/usr/bin"
echo 'echo "-L/usr/lib/aarch64-linux-gnu/mit-krb5 -Wl,-Bsymbolic-functions -Wl,-z,relro -lgssapi_krb5 -lkrb5 -lk5crypto -lcom_err"' \
    > "$SYSROOT/usr/bin/krb5-config"
chmod +x "$SYSROOT/usr/bin/krb5-config"
