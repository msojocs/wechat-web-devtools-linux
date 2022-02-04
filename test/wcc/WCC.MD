

# 输入
node_modules --- options.json
把options.json转换为命令行参数

## Windows
```
Wechat WXML Compiler, version v0.5vv_20200413_syb_scopedata
Usage: Z:\mnt\disk1\GitHub\wechat-devtools\cache\wechat_devtools_1.05.2201240_x64\code\package.nw\js\vendo
r\wcc.exe [-d] [-o OUTPUT] [-xc XComponentDefine] [-om XComponentDefine] [-cb [callback.js...]] [-llcommon
] [-llw/-lla XCPath] <FILES... | -s <SINGLE_FILE>
  Options:
  -d: output code for debug
  -o: output destination (default stdout)
 -xc: output simplified code for custom component
 -cc: output compelete code for custom component
  -s: read from stdin
 -ds: insert debug wxs info
 -cb: add life cycle callback
 -llw: compile in lazy load mode (webiew)
 -lla: compile in lazy load mode (app service)
    args XCPath: custom component paths connected by comma or --split (./page/index,./comp/comp)
```

## Linux
```
Wechat WXML Compiler, version v0.5vv_20200413_syb_scopedata
Usage: ./wcc [-d] [-o OUTPUT] [-xc XComponentDefine] [-om XComponentDefine] [-cb [callback.js...]] [-ll XCPath] <FILES... | -s <SINGLE_FILE>
  Options:
  -d: output code for debug
  -o: output destination (default stdout)
 -xc: output simplified code for custom component
 -cc: output compelete code for custom component
  -s: read from stdin
 -ds: insert debug wxs info
 -cb: add life cycle callback
 -ll: compile in lazy load mode
```

# 输出

