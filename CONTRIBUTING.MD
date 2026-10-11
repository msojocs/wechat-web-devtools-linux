# 贡献指南(仅供参考实际由审核决定是否需要调整与合并)

本指南面向给本项目（微信开发者工具 Linux 移植）提 issue / PR 的人。项目定位、使用方法、构建方式见 [README](README.MD)。

微信开发者工具版权归腾讯公司所有，本项目旨在交流学习之用。

## 一、这个项目在做什么

把 Windows 官方微信开发者工具搬到 Linux（Electron），**不改官方业务逻辑**，只打必要的移植/修复补丁：

- 官方包（`resources/`）由构建脚本下载解压，代码是压缩后的构建产物；
- 需要修的地方，用「前置/追加补丁 + 运行时 monkey patch」的方式补，补丁脚本全在 `res/scripts/`，应用补丁的脚本全在 `tools/fix-*.sh`；
- 官方版本升级后，压缩代码的写法、甚至文件名（`js/<32位hex>.js` 是按内容哈希命名的）都可能变，**补丁定位点是本项目最大的维护成本**。写补丁时请把「定位点失效时要显式报错」当成硬要求。

## 二、环境准备

1. Node.js 22 LTS（含 npm/npx）、`7z`；编译 `nodegit` 还需要 `python3 gcc g++ make pkg-config libkrb5-dev libssh2-1-dev openssl` 等，详见 README「自行构建 / 方法1」。
2. 推荐用 docker 构建（README「方法0」）：`tools/build-with-docker.sh`；本机构建：`./tools/setup-wechat-devtools.sh`。
3. `resources/`、`electron/`、`cache/`、`tmp/`、`node_modules` 都不入库（见 `.gitignore`），由脚本下载/生成；**提交 PR 时不要把这些带进来**。

## 三、构建流程

入口是 `tools/setup-wechat-devtools.sh`，分步执行，步骤状态记在 `tmp/.step`（机制见 `tools/step.sh`，错误捕获见 `tools/error-handler.sh`）：

```
INSTALL_START → 装 asar/node-gyp → 下载 electron → 下载并按 7z 解压官方 devtools 到 resources
→ rebuild node_modules → 打补丁（fix-*.sh）
```

- 失败后直接重跑即可从当前步骤继续；想从头来：`rm -rf tmp/.step resources electron`。
- 版本集中配置在 `conf/config.json`：`devtools.version`、`electron`、`compiler.version`、`node.versions`（后者只决定原生模块的目标 ABI，不限制构建机的 Node 版本）。
- 构建产物：
  - `resources/app.asar`：打包后的官方应用（除 unpack 列表外的所有文件）；
  - `resources/app.asar.unpacked/`：unpack 列表里的文件（`**/bin/**`、`**/js/unpack/**`、`**/js/common/cli/*.js`、`**/*.node`、`package.json` 等）；
  - `resources/app/`：只在「解包→打补丁→重打包」期间存在；
  - `bin/wechat-devtools`、`bin/wechat-devtools-cli`：启动脚本。

`tools/asar-helper.sh` 是唯一的解包/打包入口：

```shell
tools/asar-helper.sh unpack   # app.asar → app/，之后 app.asar 与 app.asar.unpacked 被删除
tools/asar-helper.sh pack     # app/ → app.asar（并按 --unpack 列表生成 app.asar.unpacked），之后 app/ 被删除
```

⚠️ 两者互相消耗：解包后必须打包回来。只想读代码的话用 `npx asar extract` 解到临时目录，别动工作区。

## 四、补丁怎么写（核心约定）

### 4.1 两条规则

1. **只允许「前置/追加脚本」和「运行时 monkey patch」，不要在构建脚本里做 sed/文本 replace 改官方代码。**
   正则替换在官方改写法后会静默失配，或直接把压缩代码改坏（`tools/fix-other.sh` 里注释掉的那些 `sed` 就是历史教训）。追加/前置补丁在目标文件缺失时会显式失败。
2. **补丁脚本按目标文件命名**：`res/scripts/bootstrap.js` → `js/electron/backend/bootstrap.js`；`res/scripts/cli.js` → `js/common/cli/index.js`；`res/scripts/electron_main.js` → `js/electron/main.js`；`res/scripts/config.js` → `.../miniprogram-builder/.../workerThread/config.js`。

### 4.2 两种落地方式，按「目标是否稳定」选

**A. 目标路径稳定 → shell + 追加/前置（首选）**

适用：`js/electron/**`（`package.json` 的 `main`、各窗口入口、后端入口，构建时保留固定名）、`js/common/**`、unpack 列表里的文件。

做法：`tools/fix-<特性>.sh` 里复用现成的 `apply_prepend_patch` / `apply_append_patch`（实现见 `tools/fix-compiler.sh`、`tools/fix-skill.sh`），它靠 `cmp -s -n` 判断是否已打过（幂等，重复构建输出 `is already patched`）；目标文件不存在时报错退出（记得先 `asar-helper.sh pack` 再 `exit 1`）。范例：`tools/fix-cli.sh`、`tools/fix-compiler.sh`、`tools/fix-data-path.sh`。

- 改 asar 内的文件：先 `asar-helper.sh unpack`，改完 `pack`。
- 改 `resources/app.asar.unpacked/` 下的文件（在 unpack 列表里）：直接改，不用 pack（例如 `tools/fix-cli.sh`）。

**B. 目标不确定（`js/<hash>.js` 这类）→ node 脚本按「形状」定位**

适用：要改的函数在按内容哈希命名的构建产物里，文件名随版本变化。

做法：`tools/fix-<特性>.js` 扫描候选文件，用导出的函数名等**形状条件**匹配（不要写死文件名），找到唯一候选才改，**找不到或匹配到多个就 throw，中断构建**；补丁代码仍放 `res/scripts/<name>.js`。范例：`tools/fix-webview-touch-focus.js`（按 `exports.WebviewInstance` + `setEmulationTouch` 等条件定位，`Expected one Electron xxx module, found N` 直接让构建失败）。

**如果目标模块只在某个稳定入口里被使用**，还有第三种更稳的做法：在稳定入口（如 `js/electron/main.js`）前置一段补丁，用 `Module._load` 拦截模块加载，按导出形状识别并包装目标模块（范例：`res/scripts/electron_main.js`）。这样升级不用动补丁，代价是官方改名后会静默失效，所以要配构建期校验（见 4.4）。

### 4.3 补丁脚本的写法

- 包裹标记：`/* patch wechat devtools begin */ ... /* patch wechat devtools end */`（node 脚本注入的用 `/* wechat-devtools linux <marker> begin/end */`）；
- 用 IIFE + `try/catch`，异常写 `process.stderr`，**不要阻断应用启动**；
- 追加的补丁以 `;` 开头，避免和上一行拼出 ASI 问题；
- 幂等：除了 shell 的 `cmp` 判断，运行时也可以用 `Symbol.for(...)` 打标记（见 `res/scripts/webview-touch-focus.js`）；
- 优先「包装共享模块的导出」，少复制官方代码：
  - `const fsExtra = require("fs-extra"); const existsSync = fsExtra.existsSync; fsExtra.existsSync = ...`；
  - `Object.defineProperty(global, "<名字>", { set, get })` 拦截全局赋值（范例 `res/scripts/cli.js`）；
- 报错信息要能直接指向该怎么修：说明是哪个定位点失效、需要更新哪个文件。

### 4.4 定位点校验

补丁是「按形状/路径找目标」，所以必须保证**上游改名不会以「补丁静默失效」收场**：

- 方式 A / B 天然具备：目标文件不存在就报错退出、候选文件数 ≠ 1 就 `throw`（`tools/fix-webview-touch-focus.js` 就是这么做的）。
- 按形状在运行时匹配的补丁（4.2 第三种）静态发现不了失效，需要在构建期补一条校验：`tools/check-data-path.js` 就是范例——它扫描 `js` 目录、按导出形状确认定位点还在，对不上就报错并让构建失败（在 `tools/fix-data-path.sh` 里、打补丁之前调用，失败时先把 asar 打包回去再退出）。

写这类校验时注意两点：校验要看的是**未被补丁改动过的原文**（先剥掉 `/* patch ... begin */ ... end */` 块，否则补丁自己的文字会让校验通过）；校验条件和补丁的匹配条件要一一对应，注释里写明「改一边要同步改另一边」。

### 4.5 挂到构建里

在 `tools/setup-wechat-devtools.sh` 的最后一步（`INSTALL_REBUILD_SUCCESS`）按现有顺序追加 3 行：

```bash
  notice "Patching <特性>"
  "$root_dir/tools/fix-<特性>.sh" $@
```

现有顺序：`fix-selection-copy-node.js` → `rebuild-node-modules.sh` → `fix-package-name.js` → `fix-cli.sh` → `fix-skill.sh` → `fix-compiler.sh` → `fix-data-path.sh` → `fix-other.sh`。有依赖关系的补丁放后面。

## 五、怎么找到要改的地方

1. 从稳定处入手：`package.json` 的 `main` 是 `js/electron/main.js`；各窗口入口是 `js/electron/*.js`（`entrance.js`、`preload.js`、各 `*.popup.js`）。
2. 搜压缩代码：`grep -rn '关键词' resources/app | head`；在打包文件里搜字符串用 `grep -a`；`npx asar list resources/app.asar | grep xxx` 可先看有没有对应文件。
3. 顺着 `require` 往下追：`js/electron/*.js` 里 `require('../../js/<hash>.js')` 指向的共享模块，就是业务逻辑所在。
4. 搞不清某个值从哪来时，打日志验证比读压缩代码快：先确认它在哪个进程（主进程 / 后端 fork 的子进程 / 渲染进程），再看该进程的入口文件。

## 六、验证

**改动一定要在独立 HOME 里验证，别动真实用户数据：**

```shell
rm -rf /tmp/hdt-home && mkdir -p /tmp/hdt-home
HOME=/tmp/hdt-home XDG_CONFIG_HOME= bin/wechat-devtools    # 数据与日志在 /tmp/hdt-home/.config/wechat-devtools/app/
```

- 查启动日志、数据目录、`<数据目录>/WeappLog/logs/` 下的日志，用「路径/日志/退出码」证明补丁生效，而不是「看起来能启动」。
- 启动脚本、数据目录、缓存清理相关的改动跑 `bash test/startup-test.sh`（桩 `electron`，不弹界面，秒级）。
- 手动功能回归参考 `docs/Features.MD` 的清单；调试技巧见 `docs/DEBUG.MD`；专题文档在 `docs/`（终端、CLI、编译器、主题监听等）。
- 涉及迁移/删除用户数据的改动，必须写清「用户数据会发生什么」，并在沙箱里跑通迁移与回退。

## 七、提交与 PR

- 默认分支是 **`electron`**：`git switch -c fix/xxx electron`，PR 也提向 `electron`。
- commit message 用 `类型: 描述`，类型取 `fix` / `feat` / `update` / `refactor` / `perf` / `docs` / `ci` / `build`；关联 issue 写 `Fixes #197`；一个 commit 只做一件事。
- `CHANGELOG.MD` 顶部加条目，格式：

  ```markdown
  # 2.02.2608080-2 / 2026-10-11
  - fix: 一段面向使用者的描述
  ```

  版本号 = 官方 devtools 版本 + `-<本地修订号>`（第几次本地发版），与 `conf/config.json` 的 `devtools.version` 对应；CI 用 CHANGELOG 的版本号生成 tag。
- PR 描述写清**问题 / 原因 / 改动 / 验证**，附日志或截图（截图放 `res/screenshots/`），说明测试环境（发行版、桌面环境）。
- 提交前自检：`bash test/startup-test.sh` 通过；`git status` 里不应出现 `resources/`、`electron/`、`cache/`、`tmp/` 等生成物。

## 八、升级 devtools 版本时

1. 改 `conf/config.json` 的 `devtools.version`，重跑 `tools/setup-wechat-devtools.sh`（会自动调 `tools/update-wechat-devtools.sh` 重新下载解压）；`electron`、`compiler`、`node.versions` 同理。
2. 逐个确认补丁定位点是否还有效：
   - 引用了 `js/<hash>.js` 的补丁：官方版本一变文件名就变了；
   - 匹配压缩代码里字符串/结构的补丁：写法可能被改；
   - 稳定入口（`js/electron/**`）的结构是否还和假设一致。
3. 补一条 CHANGELOG 条目，更新 `docs/Features.MD` 的勾选状态，把失效的补丁修掉再发版。

## 九、常见问题

| 现象 | 原因 / 处理 |
| --- | --- |
| `xxx is not exist` | 目标文件路径在官方新版本里变了 → 更新 `tools/fix-*.sh` 的路径，或改为按形状定位（4.2 B） |
| 补丁没生效但构建没报错 | 匹配条件静默失配（函数改名/搬走）→ 加上构建期校验，报错退出 |
| 打包后只剩 `resources/app.asar`，改动没了 | 忘了 `tools/asar-helper.sh pack` |
| 原生模块 ABI / Binding 报错 | `tools/rebuild-node-modules.sh`；目标 ABI 由 `conf/config.json` 的 `node.versions` 决定 |
| 7z 解压失败、下载失败 | 7z 版本过低、网络问题，见 README「自行构建 / 方法1」 |
| 构建中断后重跑 | 从 `tmp/.step` 记录的步骤继续；`rm -rf tmp/.step` 可从头开始 |

## 十、参考

- [移植流程记录（wiki）](https://github.com/msojocs/wechat-web-devtools-linux/wiki)
- [README](README.MD) / [CHANGELOG](CHANGELOG.MD) / [docs/](docs/)
- [微信 CLI 命令行文档](https://developers.weixin.qq.com/miniprogram/dev/devtools/cli.html)
- Linux 版编译器：[wx-compiler](https://github.com/msojocs/wx-compiler)
- Skyline：[skyline-client-server](https://github.com/msojocs/skyline-client-server)
