# 修复创建云开发控制台窗口
# 分析
1. 打开云开发控制台，提示`Uncaught TypeError:Cannot read property 'isDev' of undefined`
2. 定位错误出发位置`global.appConfig.isDev`
3. 打开云开发控制台与主界面的调试器，对比`global`对象，发现不一致，云开发控制台缺失大量属性;
4. 结合NW.js新特性（[文档链接](https://nwjs.readthedocs.io/en/latest/References/Window/#windowopenurl-options-callback)）
5. 云开发控制台应与主界面共享变量，但在新特性后，二者隔离了;因此，修复方法就是让它们共享关键变量，可通过open方法的回调实现（经尝试设定`new_instance`与`mixed_context`无效）

# 修复
## 定位Window.open位置
可通过断点调试实现

文件路径： `package.nw/core.wxvpkg.ext/284af385b4ef6206861fea66a2452277.js`
定位字符串：`nw.Window.open`
在回调函数中添加：
```
Object.keys(window).forEach(key=>{
  if(!e.window[key]){
    /*没有就添加*/
    try{
      e.window[key] = window[key];
    }catch(e){
      /*部分方法不可修改，会抛异常*/
      console.error(e);
    }
  }
})
```
界面可显示，但一直停留在"等待开发者工具初始化"界面，主界面控制台显示`MESSAGE_CENTER connection: invalid token PLUGIN_cloudconsolev1#{token}# , closing`
经检查是token存储器被隔离了，于是可借助`window`对象作为中间人传递此数据对象

## 处理TOKEN数据
修改token存储对象构造方法
```
constructor() {
  if(window.tokenData){
    /*有就直接用*/
    this._sessionToken = window.tokenData._sessionToken
    this._tokenMap = window.tokenData._tokenMap
  }else{
    /*没有就新建*/
    (this._sessionToken = ""), (this._tokenMap = {});
    window.tokenData=this;/*新建完要给中间人*/
  }
}
```