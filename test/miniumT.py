#!/usr/bin/env python3
#-- coding: UTF-8 --
import minium
# print(minium)
mini = minium.Minium({
    "project_path": r"/home/msojocs/Documents/we1", #小程序项目路径
    "dev_tool_path": r"/mnt/disk2/wechat-web-devtools-linux/bin/wechat-devtools-cli",#开发者工具的命令行工具路径
    "test_port": 9420 #minitest自动化端口
})
print(mini.get_system_info())#输出开发者工具模拟器的信息