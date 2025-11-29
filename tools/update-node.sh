#!/bin/bash
set -e

root_dir=$(cd `dirname $0`/.. && pwd -P)

# 获取配置
node_version=$(node "$root_dir/tools/parse-config.js" --get-node-version $@)
node_url=$(node "$root_dir/tools/parse-config.js" --get-node-url $@)

# 检测安装
if [ -f $root_dir/node/bin/node ];then
  # 存在，检测已有版本是否与要安装的版本一致
  version=$($root_dir/node/bin/node --version)
  if [ $version == "v$node_version" ];then
    echo "已安装NODE版本: v$node_version"
    exit 0
  fi
  # 不一致，装
fi

# ########未安装或已有版本与目标版本不一致########

# 下载
cache_dir="$root_dir/cache"
mkdir -p $cache_dir
url=$node_url
file_name=$(basename $url)
localPath="$cache_dir/${file_name}"
if [ ! -f $localPath ];then
  # 不存在，下载
  wget -c $url -O${localPath}.tmp
  mv ${localPath}.tmp ${localPath}
fi

# 解压（下载完成或已存在）
tmp_dir="$root_dir/tmp"
mkdir -p $tmp_dir
extractPath="$tmp_dir/${file_name}"
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

echo "Succeeded upgrading node to version ${node_version}"