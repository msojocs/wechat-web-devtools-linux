# 项目说明

本项目是一个完整的搭建Linux下可用的“微信开发者工具”的脚本和工具集，
用于在Linux下的GNOME桌面上搭建可以持续更新和使用的“微信开发者工具”。

# 项目地址
* https://github.com/dragonation/wechat-devtools
* https://gitee.com/dragonation/wechat-devtools

# 进度

当前工具可以在Linux上构筑最新版1.05.2008270（截止时间2020年9月4日），支持CLI模式。
另现在已经可以直接在设置界面里面修改字体，手工输入字体名称就可以。

# 使用方法

可以在本项目的[发布](https://github.com/dragonation/wechat-devtools/releases)中，寻找已经构筑好了的`.tar.gz`包（发布里也有度盘链接），下载解压后，运行其中的`bin/wechat-devtools`即可运行。

注：gitee上原来我也想放发布包的，但是文件太大了，附件最大只允许100M，而且总体积不能超过1G。所以目前暂时先只放github，如果大家发现下载速度慢的话，可以考虑科学上网或者度盘链接，速度快也稳定上传和下载。

# 系统要求

* 基于Linux的桌面系统，首选GNOME（其他的桌面环境可能会有问题，未测试）
* 安装有wine和wine-binfmt支持，建议版本在5.0以上，低版本可能会存在有问题
* 安装有libstdc++的版本为3.4.26，发布包里已经预编译了的Linux原生Node模块有这个依赖
* 如果运行的是docker镜像版本，请自行安装docker

# CLI支持

在项目的`bin`目录中有`wechat-devtools-cli`命令，是微信开发者工具的命令行支持Linux版本。相关材料可以在[微信CLI命令行V2](https://developers.weixin.qq.com/miniprogram/dev/devtools/cli.html)上找到。

# 构筑方法

1. 请先在Linux环境中自行安装`wine`和`wine-binfmt`；
2. 请到[Mewchan网站](https://www.mewchan.com/dists.mhtml)上下载最新的运行时，
并配置到PATH环境变量中;
3. 克隆本项目：
```
git clone https://github.com/dragonation/wechat-devtools.git
```
4. 在本地项目目录中执行如下的语句，构筑开发者工具：
```
./tools/setup-wechat-devtools
```
5. 在本地项目目录中执行如下的语句，可以安装应用图标（非必须）：
```
./tools/install-desktop-icon
```

之后即可通过点击应用图标启动微信开发者工具，也可以运行`bin/wechat-devtools`通过命令行启动

# 与其他Linux下的微信开发者工具版本区别

1. 支持最新版本，并个人会持续更新，确保运行和测试OK才会上传Release；
2. 自己制作了一个看得过去的图标，官方的太丑了；
3. 核心构筑过程完全开源，可以自行修改；
4. 修复了nwjs上关于Menu的段错误，确保最新版本可以正常启动；
5. 在构筑过程中会重新编译node_modules，确保原生模块可以在Linux上正确运行；
6. 可以随时更新开发者工具中的node和nwjs版本；
7. 下载更新可以支持断点再续，并使用了taobao国内的npm源，加速下载；
8. 使用了更为严谨的JS代码来控制整个构筑过程，避免Shell中出现的各类异常；
9. 手工做了一些VSCode编辑器界面的文字汉化（有些菜单很奇怪的腾讯没有汉化掉）。

# 后续计划

1. 增加Docker支持（正在尝试制作，应该不难）
2. 将`rebuild-node-modules`工具也改为`mew_js`代码

# FAQ

1. 为什么在编辑器里编辑的文本会自动复制到剪贴板？

    新版微信开发者工具使用了新的`vseditor`作为基础编辑器控件，而该控件在Linux下有一个默认配置支持Selection Clipboard。
    ```
    // Controls whether the Linux primary clipboard should be supported.
    "editor.selectionClipboard": true
    ```
    如果不想用这个功能，可以自己通过修改`~/.config/wechat_devtools/Default/Editor/User/settings.json`文件关闭。也可以通过`tools/fix-selection-copy`命令来关闭该特性

2. 为什么编辑器的字体是宋体？
  
    新版本已经可以在设置中直接手工输入修改编辑器字体了，输入字体名称后界面就会更新

3. 为什么自己构筑或更新后的运行时编辑器和调试器是一片空白？

    检查一下`conf/node.json`和`conf/nwjs.json`里面定义的版本是否与最新微信官方开发者工具的一致。如果有修改版本号的情况，则在更新完这两个JSON文件后，执行`tools/update-node`和`tools/update-nwjs`命令。然后删除`package.nw`目录重新执行`tools/setup-wechat-tools`命令（感谢ReggieCai31的issue和解决方案）

4. 为什么自己构筑的运行时加载项目时会卡住？

    检查一下在`package.nw/node_modules`目录下的node文件，是否依旧是Windows版本的dll，而非linux需要的so。如果依旧是Windows下的dll的话，可以考虑执行`tools/rebuild-node-modules`命令重新编译。如果已经是linux的so文件的话，则同问题3解决方法

5. 为什么自己构筑或更新后的在加载项目后，IDE界面会显示错误崩溃？

    同问题4解决方法

6. 本项目发布频率和更新速度是怎么样的？

    由于该项目为个人业余时间开发和维护，故并不确保及时维护和更新。通常空闲的话，会紧追微信开发者工具的发布速度。如果个人状态忙碌，那么一般会维持在两个月左右发布一次更新的频率，还请大家见谅

7. 为什么不发布在各个Linux发行版中？

    个人精力有限，维护多个发行版中的版本发布渠道稍有难度。同时不同发行版的系统支持库环境和版本并不相同，需要的测试与环境配置也稍有差异。因此个人目前倾向于通过发布`.tar.gz`的压缩包形式发布阶段性更新版本信息

8. 直接下载下来的发布包，在加载项目后，为什么右侧的编辑界面是空白？
    
    根据相关的情况分析，可以打开在微信开发者工具菜单里的调试支持。查看里面的日志报错，目前大部分情况是您的系统里libstdc++版本与预编译的版本不一致。可以考虑采用docker版本，或者执行`tools/rebuild-node-modules`命令重新编译系统支持的原生模块。

9. 自己构筑时，为什么会报告python执行错误？

    Node里的node-gyp对于python的新版本支持并不友好，建议使用2.7版本的python参与构筑，Python3在运行node-gyp时经常会出问题

10. 如何汇报自己遇到的问题？
  
    如果是界面功能上的奇怪表现，直接描述，并附上操作系统发行版版本，内核版本，桌面系统类型，wine版本，libstdc++版本即可。如果发现运行有问题，可以考虑复制命令行输出，条件允许的情况下，可以打开微信开发者工具菜单中的调试窗口，并截图提交问题

# 界面截图

版本 1.03.2006090
![screenshot 1.03.2006090](res/screenshots/1.03.2006090.jpg)

版本 1.02.2001191
![screenshot 1.02.2001191](res/screenshots/1.02.2001191.jpg)

图标
![icon](res/icons/wechat-devtools.png)

# 免责声明

微信开发者工具版权归腾讯公司所有，本项目旨在交流学习之用。如有不当之处，请联系本人，邮箱：dragonation@gmail.com
