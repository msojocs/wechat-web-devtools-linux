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
function install_pkg {
    pkg_url=$1
    pkg_name=$(basename $pkg_url)
    if [ ! -f "$pkg_name" ]; then
        wget -c $pkg_url -O $pkg_name
    fi
    dpkg -x $pkg_name $root_dir/cache/cross-tools/target
}
install_pkg http://ftp.kr.debian.org/debian-ports//pool-loong64/main/libx/libx11/libx11-dev_1.8.12-1_loong64.deb
install_pkg http://ftp.kr.debian.org/debian-ports//pool-loong64/main/libx/libxkbfile/libxkbfile-dev_1.1.0-1+b3_loong64.deb
install_pkg http://ftp.kr.debian.org/debian/pool/main/x/xorgproto/x11proto-dev_2024.1-1_all.deb
install_pkg http://ftp.kr.debian.org/debian-ports/pool-loong64/main/libx/libx11/libx11-6_1.8.12-1_loong64.deb
install_pkg http://ftp.kr.debian.org/debian-ports/pool-loong64/main/libx/libxkbfile/libxkbfile1_1.1.0-1+b3_loong64.deb
install_pkg http://ftp.kr.debian.org/debian-ports//pool-loong64/main/k/krb5/libkrb5-dev_1.22.1-2_loong64.deb
install_pkg http://ftp.kr.debian.org/debian-ports//pool-loong64/main/k/krb5/krb5-multidev_1.22.1-2_loong64.deb
install_pkg http://ftp.kr.debian.org/debian-ports//pool-loong64/main/o/openssl/openssl_3.5.4-1_loong64.deb
install_pkg http://ftp.kr.debian.org/debian-ports//pool-loong64/main/o/openssl/libssl-dev_3.5.4-1_loong64.deb
install_pkg http://ftp.kr.debian.org/debian-ports//pool-loong64/main/libs/libssh2/libssh2-1-dev_1.11.1-1_loong64.deb
install_pkg http://ftp.kr.debian.org/debian-ports//pool-loong64/main/libs/libssh2/libssh2-1t64_1.11.1-1_loong64.deb
install_pkg http://ftp.kr.debian.org/debian-ports//pool-loong64/main/z/zlib/zlib1g_1.3.dfsg+really1.3.1-1+b1_loong64.deb
install_pkg http://ftp.kr.debian.org/debian-ports//pool-loong64/main/e/e2fsprogs/comerr-dev_2.1-1.47.2-3+b3_loong64.deb
install_pkg http://ftp.kr.debian.org/debian-ports//pool-loong64/main/k/krb5/libkrb5-3_1.22.1-2_loong64.deb
install_pkg http://ftp.kr.debian.org/debian-ports//pool-loong64/main/k/krb5/libk5crypto3_1.22.1-2_loong64.deb
install_pkg http://ftp.kr.debian.org/debian-ports//pool-loong64/main/k/krb5/libgssapi-krb5-2_1.22.1-2_loong64.deb
install_pkg http://ftp.kr.debian.org/debian-ports//pool-loong64/main/e/e2fsprogs/libcom-err2_1.47.2-3+b3_loong64.deb

node-gyp install
version=$(node -p "process.versions.node")
sed -i "s#'-m64',##" $HOME/.cache/node-gyp/$version/include/node/common.gypi
sed -i "s#'-m64'##" $HOME/.cache/node-gyp/$version/include/node/common.gypi
echo 'echo "-L/usr/lib/loongarch64-linux-gnu/mit-krb5 -Wl,-Bsymbolic-functions -flto=auto -ffat-lto-objects -Wl,-z,relro -lgssapi_krb5 -lkrb5 -lk5crypto -lcom_err"' > $root_dir/cache/cross-tools/target/usr/bin/krb5-config
