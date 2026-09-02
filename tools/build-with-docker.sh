#!/bin/bash

set -e

root_dir=$(cd "$(dirname "$0")/.." && pwd -P)
dockerfile="$root_dir/docker/Dockerfile.electron"
image="wechat-devtools-build:electron-$(sha256sum "$dockerfile" | cut -c1-12)"
docker_home="$root_dir/cache/docker-home"

mkdir -p "$docker_home"

if ! docker image inspect "$image" >/dev/null 2>&1; then
    docker build -f "$dockerfile" -t "$image" "$root_dir/docker"
fi

docker run --rm -i \
    -u "$(id -u):$(id -g)" \
    -e "ACTION_MODE=${ACTION_MODE:-false}" \
    -e "HOME=/workspace/cache/docker-home" \
    -e "npm_config_prefix=/workspace/cache/npm/node_global" \
    -e "npm_config_cache=/workspace/cache/npm/node_cache" \
    -e "NODEGIT_SKIP_TESTS=1" \
    -w /workspace \
    -v "$root_dir:/workspace" \
    "$image" \
    bash ./tools/setup-wechat-devtools.sh "$@"
