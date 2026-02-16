## 0.56.1
启动进入开发窗口会崩溃
### 详情
`--mixed-context` 情况下，在任意iframe加载后，执行db创建逻辑，必定崩溃。

### 复现样本:
```json
{
  "name": "sqlite3-test",
  "version": "1.0.0",
  "description": "",
  "main": "html/index.html",
  "chromium-args": "--mixed-context",

  "author": "",
  "license": "ISC",
  "dependencies": {
    "@vscode/sqlite3": "^5.1.12-vscode"
  }
}

```
```html

<html>
    <head></head>
    <body>
        <h1>Test Page</h1>
        <iframe src="./sub.html" style="width:600px; height:400px;"></iframe>
        <script>
            setTimeout(() => {
                const sqlite3 = require('@vscode/sqlite3');
                try {
                    const db = new sqlite3.Database(':memory:', e => {});
                    console.warn('db:', db);
                } catch (err) {
                    console.error('sqlite init err', err, err.stack);
                }
            }, 1000);
        </script>
    </body>
</html>
```

### 处理方法

~~移除`--mixed-context`，但是此操作的子脚本会读不到window，需要做一些曲线救国。~~

找nwjs的iframe文档，加个`nwdisable`解决。

## 0.62.0
Check failed: current_ != end_