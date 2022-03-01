#!/bin/bash

root_dir=$(cd `dirname $0`/.. && pwd -P)
tmp_dir="$root_dir/tmp"
build_dir="$root_dir/tmp/AUR"

rm -rf $build_dir
mkdir -p $build_dir
cp "$root_dir/tools"/*.sh "$build_dir"
cp "$root_dir/tools"/*.js "$build_dir"
cp "$root_dir/res/aur"/* "$build_dir"
sed -i 's/download.fastgit.org/github.com/' "$build_dir/PKGBUILD"

if [[ $1 == 'deb' ]];then
  sed -i 's/libssh2/libssh2-1-dev/' "$build_dir/PKGBUILD"
  sed -i 's/libxkbfile/libxkbfile-dev/' "$build_dir/PKGBUILD"
  sed -i 's/gconf/gconf2/' "$build_dir/PKGBUILD"
  sed -i 's/krb5/libkrb5-dev/' "$build_dir/PKGBUILD"
fi
cd $build_dir
# makepkg