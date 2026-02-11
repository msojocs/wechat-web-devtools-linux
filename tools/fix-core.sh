#!/bin/bash
root_dir=$(cd `dirname $0`/.. && pwd -P)
# set -e
# trap 'catchError $LINENO "$BASH_COMMAND"' ERR # 捕获错误情况
# catchError() {
#     exit_code=$?
#     if [ $exit_code -ne 0 ]; then
#         fail "\033[31mcommand: $2\n  at $0:$1\n  at $STEP\033[0m"
#     fi
#     exit $exit_code
# }

notice() {
    echo -e "\033[36m $1 \033[0m "
}
warn() {
    echo -e "\033[43;37m 警告 \033[0m $1"
}
fail() {
    echo -e "\033[41;37m 失败 \033[0m $1"
}

package_dir="$root_dir/package.nw"
tmp_dir="$root_dir/tmp/core"
mkdir -p $tmp_dir
unpack_script="$root_dir/tools/wxvpkg_unpack.js"
pack_script="$root_dir/tools/wxvpkg_pack.js"
 
echo "Fix Core"
# unpack 文件 到 路径
node "$unpack_script" "$package_dir/core.wxvpkg" "$tmp_dir/core.wxvpkg"

#    ____  _____ ____  _        _    ____ _____    ____ ___  ____  _____ 
#   |  _ \| ____|  _ \| |      / \  / ___| ____|  / ___/ _ \|  _ \| ____|
#   | |_) |  _| | |_) | |     / _ \| |   |  _|   | |  | | | | |_) |  _|  
#   |  _ <| |___|  __/| |___ / ___ \ |___| |___  | |__| |_| |  _ <| |___ 
#   |_| \_\_____|_|   |_____/_/   \_\____|_____|  \____\___/|_| \_\_____|
#                                                                        

launch_find_result=$( grep -lr '"launch");(' "$tmp_dir/core.wxvpkg" )
echo "Launch触发位置: $launch_find_result"
if [[ ! -z $launch_find_result ]];then
  sed -i 's#"launch");(#"launch");await (new Promise((resolve) => setTimeout(resolve, 1000)));(#g' "$launch_find_result"
else
  warn "Launch触发位置未找到"
fi

# wcc、wcsc处理，设置WINE=fasle环境变量生效
if [[ "$WINE" != 'true' ]];then
  # 处理报错时控制台显示的环境
  find_result=$( grep -lr '(env:' "$tmp_dir/core.wxvpkg" )
  echo "env: $find_result"
  if [[ ! -z $find_result ]];then
    for file in $find_result; do
      sed -i 's#"Windows"#"Linux"#g' "$file"
    done
  else
    warn "Windows字符串位置未找到"
  fi

  current=`date "+%Y-%m-%d %H:%M:%S"`
  timeStamp=`date -d "$current" +%s`
  echo $timeStamp > "${package_dir}/.build_time"
fi

# pack 路径 到 文件
notice "pack"
node "$pack_script" "$tmp_dir/core.wxvpkg" "$package_dir/core.wxvpkg"
rm -rf "$tmp_dir/core.wxvpkg"
