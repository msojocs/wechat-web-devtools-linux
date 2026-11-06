#!/bin/bash
set -euo pipefail

root_dir=$(cd "$(dirname "$0")/.." && pwd -P)
test_dir=$(mktemp -d)
trap 'rm -rf "$test_dir"' EXIT

install_dir="$test_dir/install"
skill_dir="$install_dir/resources/app.asar.unpacked/js/common/cli"
mkdir -p "$install_dir/bin" "$skill_dir"
cp "$root_dir/bin/wechatide" "$install_dir/bin/wechatide"
printf '%s\n' '#!/bin/bash' 'exec node "$@"' > "$install_dir/bin/node"
chmod +x "$install_dir/bin/node"

# 模拟打包时前置补丁，以及官方 CLI 对 profile 路径的赋值和端口文件读取。
cat "$root_dir/res/scripts/skills/skill-index.js" > "$skill_dir/skill-index.js"
cat >> "$skill_dir/skill-index.js" <<'WECHATIDE_FIXTURE'
const fs = require('node:fs');
const path = require('node:path');
const hash = require('node:crypto').createHash('md5').update(process.env.ELECTRON_BASE_APP_PATH).digest('hex');
global.electronUserDirPathRoot = path.join(
  process.env.USERPROFILE, 'AppData', 'Local', 'wechat-devtools', 'User Data', hash
);
const portFile = path.join(global.electronUserDirPathRoot, 'Default', '.ide');
process.stdout.write(fs.readFileSync(portFile, 'utf8'));
WECHATIDE_FIXTURE

hash=$(printf '%s' "$install_dir/electron/resources/app.asar" | md5sum | cut -d' ' -f1)

check_profile() {
  local config_dir=$1
  local app_profile="$config_dir/wechat-devtools/app/Default"
  local legacy_profile="$config_dir/wechat-devtools/$hash/Default"

  mkdir -p "$app_profile" "$legacy_profile"
  printf '%s\n' 32123 > "$app_profile/.ide"
  printf '%s\n' 32124 > "$legacy_profile/.ide"
  bash "$install_dir/bin/wechatide" > "$test_dir/cli-port"
  cmp "$app_profile/.ide" "$test_dir/cli-port"
}

export HOME="$test_dir/home"
unset XDG_CONFIG_HOME
check_profile "$HOME/.config"

export XDG_CONFIG_HOME="$test_dir/custom config"
check_profile "$XDG_CONFIG_HOME"

echo 'Agent CLI profile regression tests passed'
