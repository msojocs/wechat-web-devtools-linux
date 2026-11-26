#!/bin/bash
# Patch the installed WeChat DevTools with the Skyline modules from the
# skyline-linux release configured in conf/config.json.
set -ex

root_dir=$(cd "$(dirname "$0")/.." && pwd -P)
cache_dir="$root_dir/cache/skyline"

if [ -d "$root_dir/resources/app.asar.unpacked" ]; then
    resources="$root_dir/resources/app.asar.unpacked"
else
    resources="$root_dir/resources/app"
fi

skyline_url=$(node "$root_dir/tools/parse-config.js" --get-skyline-url)
archive="$cache_dir/$(basename "$skyline_url")"
mkdir -p "$cache_dir"
rm -f "$archive" "$archive.tmp"
wget -c -O "$archive.tmp" "$skyline_url"
mv "$archive.tmp" "$archive"

tmp_dir=$(mktemp -d)
trap 'rm -rf "$tmp_dir"' EXIT
tar -xzf "$archive" -C "$tmp_dir"

cp -f "$tmp_dir/skyline.node" "$resources/node_modules/skyline-addon/build/skyline.node"
cp -f "$tmp_dir/sharedMemory.node" "$resources/node_modules/sharedMemory/sharedMemory.node"
for file in libflutter_engine.so icudtl.dat BUILD-INFO.txt; do
    if [ -f "$tmp_dir/$file" ]; then
        cp -Pf "$tmp_dir/$file" "$resources/node_modules/skyline-addon/build/$file"
    fi
done
if [ -d "$tmp_dir/bundle" ]; then
    rm -rf "$resources/node_modules/skyline-addon/bundle"
    cp -a "$tmp_dir/bundle" "$resources/node_modules/skyline-addon/bundle"
fi
