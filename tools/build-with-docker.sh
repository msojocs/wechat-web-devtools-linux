#!/bin/bash

root_dir=$(cd `dirname $0`/.. && pwd -P)
echo "$(id -u):$(id -g)"

arch=$(node "$root_dir/tools/parse-config.js" --get-arch $@)

image="msojocs/wechat-devtools-build:v1.0.6"
if [ "$arch" == "loongarch64" ]; then
    image="msojocs/wechat-devtools-build:loong64-v1.0.0"
fi
docker run --rm -i \
    -u "$(id -u):$(id -g)" \
    -e "ACTION_MODE=${ACTION_MODE:-false}" \
    -w /workspace \
    -v "$root_dir:/workspace" \
    $image \
    bash ./tools/setup-wechat-devtools.sh $@