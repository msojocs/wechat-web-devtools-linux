#!/bin/bash

root_dir=$(cd `dirname $0`/.. && pwd -P)

for size in "64" "128" "256" "512"; do
    echo "size: $size"
    install -Dm644 "$root_dir/res/icons/${size}x${size}.png" "${HOME}/.local/share/icons/hicolor/${size}x${size}/wechat-devtools.png"
done

# svg
svg_path="${HOME}/.local/share/icons/hicolor/scalable/wechat-devtools.svg"
install -Dm644 "$root_dir/res/icons/wechat-devtools.svg" "$svg_path"

# desktop
template_path="$root_dir/res/template.desktop"
install -Dm644 "$template_path" "$HOME/.local/share/applications/wechat-devtools.desktop"
sed -i 's#dir#'$root_dir'#g' "$HOME/.local/share/applications/wechat-devtools.desktop"