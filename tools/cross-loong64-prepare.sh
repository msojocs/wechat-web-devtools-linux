#!/bin/bash
set -ex

root_dir=$(cd `dirname $0`/.. && pwd -P)

mkdir -p $root_dir/cache/pkg
if [ ! -f "$root_dir/cache/x86_64-cross-tools-loongarch64-binutils_2.45-gcc_15.1.0-glibc_2.42.tar.xz" ]; then
    cd $root_dir/cache
    wget -c https://github.com/loongson/build-tools/releases/download/2025.08.08/x86_64-cross-tools-loongarch64-binutils_2.45-gcc_15.1.0-glibc_2.42.tar.xz
fi
if [ ! -d "$root_dir/cache/cross-tools" ]; then
    cd $root_dir/cache
    tar -xf x86_64-cross-tools-loongarch64-binutils_2.45-gcc_15.1.0-glibc_2.42.tar.xz
fi
cd $root_dir/cache/pkg
BASE_PORTS="http://ftp.kr.debian.org/debian-ports"
BASE_DEBIAN="http://ftp.kr.debian.org/debian"
SUITE="unstable"
COMPONENT="main"

function _index_path {
    local base_tag=$1
    local arch=$2
    echo "$root_dir/cache/pkg/Packages-${base_tag}-${arch}.xz"
}

function _download_index {
    local base_url=$1
    local base_tag=$2
    local arch=$3
    local index_path=$(_index_path "$base_tag" "$arch")
    local index_url="$base_url/dists/$SUITE/$COMPONENT/binary-$arch/Packages.xz"
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

    _download_index "$BASE_PORTS" "ports" "loong64"
    filename=$(_find_filename_in_index "$pkg_name" "$(_index_path ports loong64)")
    if [ -n "$filename" ]; then
        echo "$BASE_PORTS/$filename"
        return 0
    fi

    _download_index "$BASE_PORTS" "ports" "all"
    filename=$(_find_filename_in_index "$pkg_name" "$(_index_path ports all)")
    if [ -n "$filename" ]; then
        echo "$BASE_PORTS/$filename"
        return 0
    fi

    _download_index "$BASE_DEBIAN" "debian" "all"
    filename=$(_find_filename_in_index "$pkg_name" "$(_index_path debian all)")
    if [ -n "$filename" ]; then
        echo "$BASE_DEBIAN/$filename"
        return 0
    fi

    return 1
}

function install_pkg {
    local pkg_name=$1
    local pkg_url=$(_resolve_pkg_url "$pkg_name")
    if [ -z "$pkg_url" ]; then
        echo "Failed to resolve package URL for $pkg_name" >&2
        exit 1
    fi
    local pkg_file=$(basename "$pkg_url")
    if [ ! -f "$pkg_file" ]; then
        wget -c "$pkg_url" -O "$pkg_file"
    fi
    dpkg -x "$pkg_file" "$root_dir/cache/cross-tools/target"
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
install_pkg libssh2-1t64
install_pkg zlib1g
install_pkg comerr-dev
install_pkg libkrb5-3
install_pkg libk5crypto3
install_pkg libgssapi-krb5-2
install_pkg libcom-err2

node-gyp install
version=$(node -p "process.versions.node")
sed -i "s#'-m64',##" $HOME/.cache/node-gyp/$version/include/node/common.gypi
sed -i "s#'-m64'##" $HOME/.cache/node-gyp/$version/include/node/common.gypi
echo 'echo "-L/usr/lib/loongarch64-linux-gnu/mit-krb5 -Wl,-Bsymbolic-functions -flto=auto -ffat-lto-objects -Wl,-z,relro -lgssapi_krb5 -lkrb5 -lk5crypto -lcom_err"' > $root_dir/cache/cross-tools/target/usr/bin/krb5-config
