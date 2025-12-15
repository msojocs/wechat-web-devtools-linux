#!/bin/bash
root_dir=$(cd `dirname $0`/.. && pwd -P)

# sudo dnf install -y ffmpeg alsa-lib pango mesa-libgbm libXrandr libXdamage libXcomposite libxkbcommon libxkbcommon-x11 libdrm cups-libs atk nss libatomic

# fedora:43
docker run -it --rm \
        --name fedora-test \
        --env="DISPLAY" \
        -v="${XAUTHORITY:-${HOME}/.Xauthority}:/root/.Xauthority:ro" \
        -v="/tmp/.X11-unix:/tmp/.X11-unix:ro" \
        -v "$root_dir":/workspace \
        -w /workspace \
        fedora:43 \
        bash