#!/bin/bash
# Flatpak 入口：/app 内直接使用本项目的一套启动脚本
set -e
export WECHAT_DEVTOOLS_DIR="/app/electron"
export PATH="/app/bin:/app/electron:$PATH"
export USERPROFILE="${USERPROFILE:-$HOME/.config/wechat-devtools}"
cd /app/bin

if [[ "$1" == 'cli' ]]; then
  shift
  exec /app/bin/wechat-devtools-cli "$@"
else
  exec /app/bin/wechat-devtools "$@"
fi
