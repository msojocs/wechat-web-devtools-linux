#!/bin/bash

_dir=$(cd `dirname $0`/.. && pwd -P)
if [ -f "$_dir/tmp/.step" ];then
    CURRENT_STEP=`cat "$_dir/tmp/.step"`
    unset _dir
    if [ "$CURRENT_STEP" == "" ];then
        echo "default"
        CURRENT_STEP="INSTALL_START"
    fi
else
    CURRENT_STEP="INSTALL_START"
fi

INSTALL_START="INSTALL_START"
INSTALL_NODE_SUCCESS="INSTALL_NODE_SUCCESS"
INSTALL_NPM_CONFIG_SUCCESS="INSTALL_NPM_CONFIG_SUCCESS"
INSTALL_GYP_SUCCESS="INSTALL_GYP_SUCCESS"
INSTALL_NW_SUCCESS="INSTALL_NW_SUCCESS"
INSTALL_WECHAT_SUCCESS="INSTALL_WECHAT_SUCCESS"
INSTALL_REBUILD_SUCCESS="INSTALL_REBUILD_SUCCESS"


step_switch() {
    echo -e "\033[42;36m 切换步骤-> \033[0m $1"
    CURRENT_STEP=$1
    _dir=$(cd `dirname $0`/.. && pwd -P)
    echo -n "$1" > "$_dir/tmp/.step"
    unset _dir
}

step_error() {
    echo -e "\033[41;37m 步骤异常-> \033[0m $1 $2"
    step_switch $2
    CURRENT_STEP=$1
    exit
}

step_over() {
    _dir=$(cd `dirname $0`/.. && pwd -P)
    echo -n "" > "$_dir/tmp/.step"
    unset _dir
}
