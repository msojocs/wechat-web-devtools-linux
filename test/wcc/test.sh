#!/bin/bash
cd /home/msojocs/Documents/we1 && \
/mnt/disk1/GitHub/wechat-devtools/package.nw/node_modules/wcc/bin/linux/wcc -d --split ">_<9772" -cc "2>_<9772./pages/index/index.wxml>_<97720>_<9772./pages/logs/logs.wxml>_<97720" ./pages/index/index.wxml ./pages/logs/logs.wxml -gn $gwx
# | grep Z

# cd /home/msojocs/Documents/we1 && \
# wine /mnt/disk1/GitHub/wechat-devtools/cache/wechat_devtools_1.05.2201240_x64/code/package.nw/js/vendor/wcc.exe \
# " -d --split >_<9772 -xc 2>_<9772./pages/index/index.wxml>_<97720>_<9772./pages/logs/logs.wxml>_<97720" \
# " ./pages/logs/logs.wxml ./pages/index/index.wxml -gn $gwx"