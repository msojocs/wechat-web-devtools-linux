#!/bin/bash
# CLI 补丁（res/scripts/cli.js、bin/wechat-devtools-cli）回归测试。
# 用真实的 bin/wechat-devtools-cli、bin/node 和补丁代码；electron 用 node 代替，
# 官方 CLI 换成一小段模拟代码，只复现和补丁相关的三处行为。
set -euo pipefail

root_dir=$(cd "$(dirname "$0")/.." && pwd -P)
test_dir=$(mktemp -d)
trap 'rm -rf "$test_dir"' EXIT

install_dir="$test_dir/install"
cli_dir="$install_dir/resources/app.asar.unpacked/js/common/cli"
mkdir -p "$install_dir/bin" "$install_dir/electron" "$cli_dir"
cp "$root_dir/bin/wechat-devtools-cli" "$root_dir/bin/node" "$install_dir/bin/"
# 用 node 的绝对路径：启动脚本把 bin/ 放在 PATH 最前，直接写 node 会找到 bin/node，自己调自己
node_bin=$(command -v node)
printf '%s\n' '#!/bin/bash' "exec \"$node_bin\" \"\$@\"" > "$install_dir/electron/electron"
# IDE 启动脚本：记下收到的参数
printf '%s\n' '#!/bin/bash' 'echo "$@" > "$LAUNCH_LOG"' > "$install_dir/bin/wechat-devtools"
chmod +x "$install_dir/bin/"* "$install_dir/electron/electron"
printf '%s' '{"name":"wechat-devtools","main":"js/electron/main.js"}' \
  > "$install_dir/resources/app.asar.unpacked/package.json"

# 模拟打包时前置补丁（同 tools/fix-cli.sh），后面接模拟的官方 CLI。
cat "$root_dir/res/scripts/cli.js" > "$cli_dir/index.js"
cat >> "$cli_dir/index.js" <<'CLI_FIXTURE'
;(() => {
  const path = require('path')
  // 官方 CLI：带 --electron 时，Linux 上从 argv[4] 开始取参数
  const args = process.argv.indexOf('--electron') > -1 ? process.argv.slice(4) : process.argv.slice(2)
  // 官方 CLI：Windows 形式的 profile 目录，由补丁改写
  global.userDirPath = path.join(process.env.USERPROFILE || '~', 'AppData/Local/wechat-devtools/User Data/0123abcd/Default')
  if (args[0] === 'start') {
    // 官方 CLI：IDE 没在运行时用 electron 本体启动 IDE
    require('child_process').spawn(process.execPath, ['--cli', '--remote-port', '12345'], { stdio: 'ignore' })
      .on('exit', () => console.log('started'))
    return
  }
  console.log(JSON.stringify({ args, userDirPath: global.userDirPath }))
})();
CLI_FIXTURE

cli() { bash "$install_dir/bin/wechat-devtools-cli" "$@"; }

check_config_dir() {
  local config_dir=$1
  local profile="$config_dir/wechat-devtools/app/Default"
  local out

  out=$(cli islogin --lang zh)
  # 1. 第一个参数不能被吞掉
  [[ "$out" == *'"args":["islogin","--lang","zh"]'* ]] || { echo "参数不对：$out" >&2; exit 1; }
  # 2. profile 目录和 IDE 一致，且已建好
  [[ "$out" == *"\"userDirPath\":\"$profile\""* ]] || { echo "数据目录不对：$out" >&2; exit 1; }
  [[ -d "$profile" ]] || { echo "没有建 $profile" >&2; exit 1; }
}

export HOME="$test_dir/home"
unset XDG_CONFIG_HOME
check_config_dir "$HOME/.config"

export XDG_CONFIG_HOME="$test_dir/custom config"
check_config_dir "$XDG_CONFIG_HOME"

# 3. IDE 没在运行时，改用 bin/wechat-devtools 启动
export LAUNCH_LOG="$test_dir/launch.log"
cli start > /dev/null
[[ "$(cat "$LAUNCH_LOG" 2>/dev/null)" == "--cli --remote-port 12345" ]] \
  || { echo "没有通过 bin/wechat-devtools 启动 IDE" >&2; exit 1; }

echo 'CLI patch regression tests passed'
