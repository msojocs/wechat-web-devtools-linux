
  
<div align="center">

  <img src="./res/icons/512x512.png" height="100px" width="100px"/>

  <h3>微信开发者工具 Linux版</h3>
  <br>

----

[![Node.js CI](https://github.com/msojocs/wechat-devtools-linux/actions/workflows/release.yml/badge.svg)](https://github.com/msojocs/wechat-devtools-linux/actions/workflows/release.yml)
[![wechat-tools](https://img.shields.io/badge/wechat--devtools-1.06.2405020-yellow)](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
[![nwjs](https://img.shields.io/badge/nwjs-0.55.0-green)](https://nwjs.io/downloads/)
[![node](https://img.shields.io/badge/node-16.4.2-orange)](https://nodejs.org/en/)


  这是微信开发者工具 Linux版
  

  <br>
</div>

# 项目说明

本项目是一个完整的搭建Linux下可用的“微信开发者工具”的脚本和工具集，
用于在Linux下的GNOME桌面上搭建可以持续更新和使用的“微信开发者工具”。

本项目修改自：https://github.com/dragonation/wechat-devtools/

# 项目地址

* https://github.com/msojocs/wechat-web-devtools-linux

# 进度

当前工具可以在Linux上构筑最新版 `1.06.2405020`，支持CLI模式。
另现在已经可以直接在设置界面里面修改字体，手工输入字体名称就可以。

# 功能测试记录

[测试记录](docs/Features.MD)

注意: 

此测试仅在修复某项功能时测试通过，并不代表阁下在使用时是正常可用的；因为我没有精力在每个版本发布前进行一次测试。

在阁下遇到任何无法解决的问题时，请新建一个 [issue](https://github.com/msojocs/wechat-web-devtools-linux/issues/new/choose)

# 系统要求

* 基于Linux的桌面系统，首选GNOME（其他的桌面环境可能会有问题，未测试）
* CI自动构建的包对 glibc 和 libstdc++ 有一定的版本要求，glibc 的版本要求2.23，libstdc++ 的版本要求3.4.21
* 如果你下载的是 `wine` 版本，那么你需要安装有 `wine` `wine-binfmt` 支持，建议版本在5.0以上，低版本可能会存在有问题

# CLI支持

在项目的 `bin` 目录中有 `wechat-devtools-cli` 脚本，是微信开发者工具的命令行支持 的Linux版本。相关资料可以在[微信CLI命令行V2](https://developers.weixin.qq.com/miniprogram/dev/devtools/cli.html)上找到。

# 使用方法

1. [在线安装](#在线安装)
2. 可以在本项目的[Release](https://github.com/msojocs/wechat-web-devtools-linux/releases)中，寻找已经构筑好了的软件包，下载使用。
如果`Release`版本存在问题，可以尝试[Continuous](https://github.com/msojocs/wechat-web-devtools-linux/releases/tag/continuous)版本，这是基于`master`分支的最新提交构建的，会及时修复一些 bug，但也可能会带来新的 bug。
3. 你可以 [自行构建](#自行构建)

# 在线安装

目前支持以下平台：

1. 统信应用商店（deepin）

# 自行构建

> 注：
> 如果想构建 wine 版本，请添加环境变量：`export WINE=true` 。注意：不受支持。

## 方法0（推荐）

理论上此方法99%成功;在网络不稳定时容易失败（原因懂得都懂，构建过程已经尽量使用镜像源）

1. 如果构建 `wine` 版本，请先在Linux环境中自行安装 `wine` `wine-binfmt`；
2. 请安装 `docker` `docker-compose`
3. 克隆本项目：
    ```
    git clone --recurse-submodules https://github.com/msojocs/wechat-web-devtools-linux.git
    ```
4. 在本地项目目录中执行如下的语句，构建开发者工具：
    ```
    tools/build-with-docker.sh
    ```
5. 在本地项目目录中执行如下的语句，可以安装应用图标（非必须）：
    ```
    ./tools/install-desktop-icon-node
    ```

之后即可通过点击应用图标启动微信开发者工具，也可以运行 `bin/wechat-devtools` 通过命令行启动

## 方法1

由于使用到 `node-gyp` `nw-gyp`，此方法会受 `python`、`node` 版本影响出现一些难以预料的异常（比如使用 `node15.0.1` 时，大部分模块构建会被忽略，但没有任何报错信息）。但是，`Docker` 构建方式会帮你处理好这些问题。

1. 如果构建 `wine` 版本，请先在Linux环境中自行安装 `wine` `wine-binfmt`；
2. 安装编译 `nodegit` 所需的依赖：`python2.7 python3.6及以上 libkrb5-dev gcc openssl libssh2-1-dev g++ make pkg-config` ；
   
   另外 `7z` 旧版解压可能存在问题（未测试最低版本号，比如：ubuntu16.04 自带的不行），请参考[`Dockerfile`](docker/Dockerfile)
3. 克隆本项目：
    ```
    git clone --recurse-submodules https://github.com/msojocs/wechat-web-devtools-linux.git
    ```
4. 在本地项目目录中执行以下命令，构建开发者工具：
    ```
    ./tools/setup-wechat-devtools-bash
    ```
5. 在本地项目目录中执行如下的语句，可以安装应用图标（非必须）：
    ```
    ./tools/install-desktop-icon-bash
    ```

之后即可通过点击应用图标启动微信开发者工具，也可以运行 `bin/wechat-devtools` 通过命令行启动

# 与其他Linux下的微信开发者工具版本区别

1. 支持最新版本，并个人会持续更新，在添加新的tag时，actions会自动构建并上传Release；
2. 核心构筑过程完全开源，可以自行修改；
3. 修复了nwjs上关于Menu的段错误，确保最新版本可以正常启动 (by dragonation)；
4. 在构筑过程中会重新编译node_modules，确保原生模块可以在Linux上正确运行；
5. 下载更新可以支持断点再续，并使用了taobao国内的npm源，加速下载（稳定性待测试）。
6. 纯 Linux 支持，使用 nodejs 实现模拟官方编译器

# 后续计划

请参考: [处理计划](https://github.com/msojocs/wechat-devtools-linux/projects?type=beta)

# 移植相关

请参考: [移植流程记录](https://github.com/msojocs/wechat-web-devtools-linux/wiki)

# FAQ

请参考: [FAQ](docs/FAQ.MD)

# 界面截图

版本 1.05.2201240
![screenshot 1.03.2006090](res/screenshots/1.05.2201240.png)

版本 1.03.2006090
![screenshot 1.03.2006090](res/screenshots/1.03.2006090.jpg)

版本 1.02.2001191
![screenshot 1.02.2001191](res/screenshots/1.02.2001191.jpg)

# 赞赏

  如果这个仓库让你感到舒适，可以点个Star或者请这个菜鸡大学生喝杯咖啡（请尽量带上github昵称）：

  ![赞赏码](https://user-images.githubusercontent.com/20937135/154661198-93854dc1-c8ba-4c97-a7ab-9f8de26c0226.png)

# 感谢赞赏支持

时间倒序

| 赞赏人 | 赞赏 | 时间 |
|-------|---------|-----|
| [shao4598](https://github.com/shao4598) | 50.00￥ | 2024-09-24 |
| [OWALabuy](https://github.com/OWALabuy) | 16.66￥ | 2024-08-28 |
| [wangvation](https://github.com/wangvation) | 50.00￥ | 2024-07-16 |
| 孤泉冷月 | 100.00￥ | 2024-07-12 |
| [liushuai05](https://github.com/liushuai05) | 88.00￥ | 2023-12-26 |
| LGTU | 10.00￥ | 2023-11-25 |
| [WRXinYue](https://github.com/WRXinYue) | 10 | 2023-11-09 |
| silentdoer | 50.00￥ | 2023-09-26 |
| ??? | 20 |2023-08-11 |
| Geequlim | 100 | 2023-07-12 |
| 对方正在输入 | 10 | 2023-04-28 |
| @DaqiongYang | 50 | 2023-03-29 |
| AInoob | 5 | 2023-01-30 |
| ??? | 5  | 2023-01-18 |
| 仙人柱 | 50.00￥ | 2022-08-09 |
| [guanzhengyinqin](https://github.com/guanzhengyinqin) | 20.00￥ | 2022-07-14 |
| [nsfoxer](https://github.com/nsfoxer) | 10.00￥ | 2022-06-30 |
| [chiiihc](https://github.com/chiiihc) | 5.00￥ | 2022-06-17 |
| [younland](https://github.com/younland) | 20.00￥ | 2022-06-15 |
| [chiiihc](https://github.com/chiiihc) | 5.00￥ | 2022-06-14 |
| 陈陈菌 | 10.00￥ | 2022-05-29 |
| WWW |  5.00￥ | 2022-05-26 |
| 南极の短尾猫 | 20.00￥ | 2022-05-22 |
| 猪宝的猪 | 20.00￥ | 2022-05-15 |
| finalwhy | 66.60￥ | 2022-05-09 |
| [CoryByte](https://github.com/Corybyte) | 5.00￥ | 2022-04-23 |
| [Starrah](https://github.com/Starrah) | 50.00￥ | 2022-04-12 |
| [zyk-miao](https://github.com/zyk-miao) | 5.00￥ | 2022-04-12 |
| [icepie](https://github.com/icepie) | 20.00￥ | 2022-04-08 |
| Milder | 50.00￥ | 2022-03-23 |
| . | 20.00￥ | 2022-03-21 |
| shaoxp | 5.00￥ | 2022-03-16 |
| 李喆 | 10.00￥ | 2022-03-05 |
| david | 5.00￥ | ??? |

# 免责声明

微信开发者工具版权归腾讯公司所有，本项目旨在交流学习之用。如有不当之处，请联系本人，邮箱：jiyecafe@gmail.com

## Stargazers over time

[![Stargazers over time](https://starchart.cc/msojocs/wechat-web-devtools-linux.svg)](https://starchart.cc/msojocs/wechat-web-devtools-linux)
