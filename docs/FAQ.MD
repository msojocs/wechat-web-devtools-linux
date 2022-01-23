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

    检查一下`conf/node.json`和`conf/nwjs.json`里面定义的版本是否与最新微信官方开发者工具的一致。如果有修改版本号的情况，则在更新完这两个JSON文件后，执行`tools/update-node`和`tools/update-nwjs`命令。然后删除`package.nw`目录重新执行`tools/setup-wechat-devtools`命令（感谢ReggieCai31的issue和解决方案）

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