#!/bin/bash
#
# 指定版本：
# 格式：version=xxxx
# version: latest - 最新
#          x.xx.xxxxx - 指定版本号
# 

root_dir=$(cd `dirname $0`/.. && pwd -P)

export PATH="$root_dir/tools:$PATH"
# 步骤
source "step.sh"

set -ex
trap 'catchError $LINENO "$BASH_COMMAND"' ERR # 捕获错误情况
catchError() {
    exit_code=$?
    if [ $exit_code -ne 0 ]; then
        fail "\033[31mcommand: $2\n  at $0:$1\n  at $STEP\033[0m"
    fi
    exit $exit_code
}
success() {
    echo -e "\033[42;37m 成功 \033[0m $1"
}
fail() {
    echo -e "\033[41;37m 失败 \033[0m $1"
}
notice() {
    echo -e "\033[36m $1 \033[0m "
}


if [ $CURRENT_STEP == $INSTALL_START ];then
  rm -rf "$root_dir"/{node,nwjs,package.nw}
  echo "==========Initializing node=========="
  if [ -f "$root_dir/node/bin/node" ]; then
    step_switch $INSTALL_NODE_SUCCESS
    success "node安装完毕"
  else
    "$root_dir/tools/update-node.sh" $@
    step_switch $INSTALL_NODE_SUCCESS
    success "node ok"
  fi

  if [ ! -f "$root_dir/node/bin/node" ]; then
    step_switch $INSTALL_START
    fail "Node安装失败"
    exit
  fi
fi

# 将node加入环境
export PATH="$root_dir/cache/npm/node_global/bin:$PATH"
node --version
npm --version

if [[ -z "$HOME" || "$HOME" = "/" ]]; then
  # 部分环境HOME定义异常，导致权限问题
  export HOME="/tmp/home"
  mkdir -p /tmp/home
fi
if [ $CURRENT_STEP == $INSTALL_NODE_SUCCESS ];then
  npm config set prefix "$root_dir/cache/npm/node_global"
  npm config set cache "$root_dir/cache/npm/node_cache"
  if [ "$ACTION_MODE" != "true" ]; then
      notice "非ACTION模式, 设置镜像源"
      # npm config set registry http://registry.npmmirror.com/ # 注册模块镜像
      # npm config set disturl http://npmmirror.com/dist # node-gyp 编译依赖的 node 源码镜像
  fi
  step_switch $INSTALL_NPM_CONFIG_SUCCESS
fi

if [ $CURRENT_STEP == $INSTALL_NPM_CONFIG_SUCCESS ];then
  notice "=====安装node-gyp nw-gyp===="
  npm uninstall node-gyp -g
  npm install node-gyp nw-gyp@3.6.6 -g --registry=http://registry.npmmirror.com/
  echo $PATH
  node-gyp install
  node-gyp list
  step_switch $INSTALL_GYP_SUCCESS
fi

if [ $CURRENT_STEP == $INSTALL_GYP_SUCCESS ];then
  echo "==========Initializing nwjs=========="
  if [ -f "$root_dir/nwjs/nw" ]; then
    success "nwjs安装完毕"
  else
    "$root_dir/tools/update-nwjs.sh" $@
  fi
  step_switch $INSTALL_NW_SUCCESS
fi

# 7z旧版本解压不正常
# rm -rf "$root_dir/tmp/7z"
# mkdir -p "$root_dir/tmp/7z"
# cd "$root_dir/tmp/7z"
# wget https://www.7-zip.org/a/7z2107-linux-x64.tar.xz
# tar -xJf 7z2107-linux-x64.tar.xz
# ln -s 7zz 7z
# export PATH="$root_dir/tmp/7z:$PATH"

if [ $CURRENT_STEP == $INSTALL_NW_SUCCESS ];then
  notice "==========Initializing wechat-devtools package=========="
  if [[ $@ == *version* ]];then
    # 参数有版本号，优先级高，清空TARGET_VERSION
    echo "参数有版本号"
    TARGET_VERSION=""
  else
    # 参数没有版本号，获取
    echo "参数没有版本号"
    VERSION_DATA=$(node "$root_dir/tools/parse-config.js" --get-devtools-version $@)
    TARGET_VERSION="version=${VERSION_DATA}"
  fi
  echo "TARGET_VERSION: $TARGET_VERSION"
  if [ ! -f "$root_dir/package.nw/package.json" ];then
    # 没装，直接装
    node "$root_dir/tools/update-wechat-devtools.js" $TARGET_VERSION $@
    
    step_switch $INSTALL_WECHAT_SUCCESS
  else
    # 装了，获取已安装版本
    DEVTOOLS_VERSION=$( cat "$root_dir/package.nw/package.json" | grep -m 1 -Eo "\"[0-9]{1}\.[0-9]{2}\.[0-9]+" )
    DEVTOOLS_VERSION="${DEVTOOLS_VERSION//\"/}"
    # 已安装, 比较目标版本
    if [ "$TARGET_VERSION" != "$DEVTOOLS_VERSION" ];then
      node "$root_dir/tools/update-wechat-devtools.js" $TARGET_VERSION $@
    fi
    step_switch $INSTALL_WECHAT_SUCCESS
  fi
fi

if [ $CURRENT_STEP == $INSTALL_WECHAT_SUCCESS ];then
  notice "Patching wechat-devtools package name"
  "$root_dir/tools/fix-package-name.js"

  notice "Patching wechat-devtools editor selection autocopy"
  "$root_dir/tools/fix-selection-copy-node"

  notice "Patching wechat-devtools CLI supports"
  "$root_dir/tools/fix-cli.sh"

  notice "Patching wechat-devtools core.wxvpkg"
  "$root_dir/tools/fix-core.sh"

  notice "Rebuilding wechat-devtools node modules"
  nwjs_version=$(node "$root_dir/tools/parse-config.js" --get-nwjs-version $@)
  "$root_dir/tools/rebuild-node-modules.sh" "$nwjs_version" $@
  step_switch $INSTALL_REBUILD_SUCCESS
fi

if [ $CURRENT_STEP == $INSTALL_REBUILD_SUCCESS ];then
  notice "Patching wechat-devtools"
  "$root_dir/tools/fix-menu.sh"

  notice "Patching Other"
  "$root_dir/tools/fix-other.sh" $@

  notice "Replace Skyline"
  "$root_dir/tools/replace-skyline.sh"
fi

success "微信开发者工具安装完毕"

step_over
