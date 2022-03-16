#!/bin/bash
set -e

root_dir=$(cd `dirname $0`/.. && pwd -P)

# 获取配置
NODE_VERSION=$1
source "$root_dir/conf/node_info"
echo "NODE_VERSION:$NODE_VERSION"
echo "NODE_URL_CN:$NODE_URL_CN"
echo "NODE_URL_GLOBAL:$NODE_URL_GLOBAL"

# 检测安装
if [ -f $root_dir/node/bin/node ];then
  # 存在，检测已有版本是否与要安装的版本一致
  version=$($root_dir/node/bin/node --version)
  if [ $version == "v$NODE_VERSION" ];then
    echo "已安装NODE版本: v$NODE_VERSION"
    exit 0
  fi
  # 不一致，装
fi

# ########未安装或已有版本与目标版本不一致########

# 下载
cache_dir="$root_dir/cache"
mkdir -p $cache_dir
if [ "$ACTION_MODE" == "true" ];then
  echo "ACTION_MODE true"
  url=$NODE_URL_GLOBAL
else
  echo "ACTION_MODE false"
  url=$NODE_URL_CN
fi
parse=(${url//\// })
localPath="$cache_dir/${parse[-1]}"
if [ ! -f $localPath ];then
  # 不存在，下载
  wget -c $url -O${localPath}.tmp
  mv ${localPath}.tmp ${localPath}
fi

# 解压（下载完成或已存在）
tmp_dir="$root_dir/tmp"
mkdir -p $tmp_dir
extractPath="$tmp_dir/${parse[-1]}"
rm -rf $extractPath
mkdir -p $extractPath
tar xf $localPath -C $extractPath

# 升级
rm -rf "$root_dir/node"
ls $extractPath | xargs -I {} mv $extractPath/{} "$root_dir/node"
rm -rf $extractPath
if [ -d "$root_dir/nwjs" ];then
  cd "$root_dir/nwjs"
  rm -rf node node.exe
  ln -s ../node/bin/node node
  ln -s node node.exe
fi

echo "Succeeded upgrading node to version ${NODE_VERSION}"