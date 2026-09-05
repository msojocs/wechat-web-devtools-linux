#!/bin/bash
set -euo pipefail

# Requires debhelper, fakeroot and dpkg-dev.
root_dir=$(cd "$(dirname "$0")/.." && pwd -P)
test_dir=$(mktemp -d)
trap 'rm -rf "$test_dir"' EXIT

for variant in linux wine; do
  package="io.github.msojocs.wechat-devtools-$variant"
  build_dir="$test_dir/$variant"
  runtime="opt/apps/$package/files/bin/electron"
  mkdir -p "$build_dir/debian/$package/$runtime"
  cp "$root_dir/res/deepin/debian/rules" "$root_dir/res/deepin/debian/compat" "$build_dir/debian/"
  printf '%s\n' \
    "Source: $package" \
    'Section: devel' \
    'Priority: optional' \
    'Maintainer: Test <test@example.com>' \
    '' \
    "Package: $package" \
    'Architecture: all' \
    'Description: Sandbox packaging regression fixture' > "$build_dir/debian/control"
  printf '%s\n' \
    "$package (1.0) unstable; urgency=medium" \
    '' \
    '  * Test fixture.' \
    '' \
    ' -- Test <test@example.com>  Sat, 05 Sep 2026 00:00:00 +0000' > "$build_dir/debian/changelog"
  printf '%s\n' '#!/bin/sh' 'exit 0' > "$build_dir/debian/$package/$runtime/chrome-sandbox"
  cp "$build_dir/debian/$package/$runtime/chrome-sandbox" "$build_dir/debian/$package/$runtime/electron"
  chmod 755 "$build_dir/debian/$package/$runtime/chrome-sandbox"
  chmod 777 "$build_dir/debian/$package/$runtime/electron"

  (
    cd "$build_dir"
    fakeroot sh -ec '
      make -f debian/rules override_dh_fixperms
      dh_gencontrol
      make -f debian/rules override_dh_builddeb
    '
  )

  archive="$test_dir/${package}_1.0_all.deb"
  dpkg-deb --fsys-tarfile "$archive" > "$test_dir/data.tar"
  read -r mode owner _ < <(tar --numeric-owner -tvf "$test_dir/data.tar" "./$runtime/chrome-sandbox")
  test "$mode" = '-rwsr-xr-x'
  test "$owner" = '0/0'

  # Normal runtime executables must still receive dh_fixperms defaults.
  read -r mode owner _ < <(tar --numeric-owner -tvf "$test_dir/data.tar" "./$runtime/electron")
  test "$mode" = '-rwxr-xr-x'
  test "$owner" = '0/0'
  echo "$package: chrome-sandbox is root:root 4755; electron is root:root 755"
done
