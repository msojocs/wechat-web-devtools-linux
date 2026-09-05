#!/bin/bash
set -euo pipefail

root_dir=$(cd "$(dirname "$0")/.." && pwd -P)
test_dir=$(mktemp -d)
trap 'rm -rf "$test_dir"' EXIT

mkdir -p "$test_dir/install/bin" "$test_dir/install/resources/app.asar.unpacked" "$test_dir/install/electron"
cp "$root_dir/bin/wechat-devtools" "$test_dir/install/bin/wechat-devtools"
printf '%s\n' '{"name":"wechat-devtools","main":"index.js"}' > "$test_dir/install/resources/app.asar.unpacked/package.json"
printf '%s\n' 'build-1' > "$test_dir/install/resources/.build_time"
printf '%s\n' '#!/bin/bash' 'test -f "$APPDATA/.build_time"' > "$test_dir/install/electron/electron"
chmod +x "$test_dir/install/electron/electron"

run_launcher() {
  bash "$test_dir/install/bin/wechat-devtools" > "$test_dir/stdout" 2> "$test_dir/stderr"
  test ! -s "$test_dir/stderr"
}

check_cache_lifecycle() {
  local config_dir=$1
  local appdata="$config_dir/wechat-devtools/app"

  # First launch must create the data directory before recording the build.
  run_launcher
  cmp "$test_dir/install/resources/.build_time" "$appdata/.build_time"

  mkdir -p "$appdata/WeappCache" "$appdata/WeappVendor" "$config_dir/wechat_devtools"
  touch "$appdata/WeappCache/keep" "$appdata/WeappVendor/keep" "$config_dir/wechat_devtools/keep" "$appdata/settings.json"

  run_launcher
  test ! -s "$test_dir/stdout"
  test -f "$appdata/WeappCache/keep"
  test -f "$appdata/WeappVendor/keep"
  test -f "$config_dir/wechat_devtools/keep"

  # A new build clears caches but preserves other application data.
  printf '%s\n' 'older-build' > "$appdata/.build_time"
  run_launcher
  cmp "$test_dir/install/resources/.build_time" "$appdata/.build_time"
  test ! -e "$appdata/WeappCache"
  test ! -e "$appdata/WeappVendor"
  test ! -e "$config_dir/wechat_devtools"
  test -f "$appdata/settings.json"
}

export HOME="$test_dir/home"
unset XDG_CONFIG_HOME
check_cache_lifecycle "$HOME/.config"

export XDG_CONFIG_HOME="$test_dir/custom config"
check_cache_lifecycle "$XDG_CONFIG_HOME"

# An unusable data path must stop startup instead of launching Electron.
touch "$test_dir/not-a-directory"
export XDG_CONFIG_HOME="$test_dir/not-a-directory/config"
printf '%s\n' '#!/bin/bash' 'touch "$HOME/electron-started"' > "$test_dir/install/electron/electron"
if bash "$test_dir/install/bin/wechat-devtools" > "$test_dir/stdout" 2> "$test_dir/stderr"; then
  echo 'Launcher unexpectedly accepted an unusable data directory' >&2
  exit 1
fi
test ! -e "$HOME/electron-started"

echo 'Startup regression tests passed'
