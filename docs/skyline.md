# Skyline 实现方案与进度

## 现状

本项目是一个windows软件的移植项目，大部分功能都完成了移植，但是存在部分功能无法移植。

无法移植的原因：功能相关的模块使用native语言编写，且找不到linux版本，无法移植。

如何实现：希望通过通信能形式间接实现功能。

## 模块原理

Skyline是一个基于flutter engine的定制化渲染引擎，是一个node native模块，模仿实现几乎不可能。

1. 小程序逻辑层，是用来调用skyline.node渲染画面的。
2. 渲染后把像素写入共享内存。
3. UI显示层，读取共享内存的项目进行渲染。
4. 还有一个连接小程序逻辑层的devtools。
5. 用户操作UI显示层会把动作发送给小程序逻辑层（应该是websocket），逻辑层处理后更新共享内存的画面数据。

## 实现方案

于是采用折中的方案：

1. 将小程序逻辑层放到wine+electron+skyline.node+sharedMemory.node中执行；sharedMemory.node是win定制版，支持linux与wine数据互通；skyline.node是原版。
2. UI显示层调用的sharedMemory.node使用Linux版本。
3. 拦截wechat-devtools的一些操作，通过skyline-client-server项目进行通信，控制wine逻辑层。

sharedMemory 线上版本：https://github.com/msojocs/skyline-shared-memory，本地目录 `~/github/skyline-shared-memory`。

Wine 逻辑层项目：`~/github/skyline-client-server`。

## 2026-09-09 现状审计

完整链路应为：

```text
Linux wechat-devtools renderer
  -> Linux skyline.node 客户端
  -> Wine 中的 Windows Electron server
  -> 官方 Windows skyline.node（SkylineShell 引擎）
  -> Windows sharedMemory.node
  -> /dev/shm
  -> Linux sharedMemory.node
  -> Linux pageframe 显示
```

### 已完成

1. `skyline-client-server` 已有 Linux Rust 客户端、Windows/Wine Electron 宿主和 TypeScript RPC server。
2. `skyline-shared-memory` v1.0.4 已提供 Linux/Windows 两端模块；主仓库展开包当前使用 Linux ELF 版本。
3. 主仓库分支 `skyline/electron` 的 `147bf8e` 已把 appservice 的同步 dialog 请求桥接回微信 renderer 的原 handler。
4. 主仓库 `6894856` 已为被代理的 appservice webview 补充 `enableBlinkFeatures=SharedArrayBuffer`。
5. `skyline-client-server` 已新增兼容旧 NW.js/新 Electron 安装包布局的 addon 提取器；真实 2.02 包和合成旧布局均已验证。

### 已确认阻塞

1. 官方 `SkylineShell` 引擎只有 Windows x64 模块；Linux 原生启动 `skyline-client-server` 只能运行客户端/RPC 层，不能完成渲染。服务端必须在 Wine 中运行 Windows Electron 并加载官方 addon。
2. 这一项已修复：`skyline-client-server/tools/extract-skyline-addon.sh`、prepare 和 Dockerfile 会识别当前 `resources/app.asar.unpacked/...` 以及旧的 `code/package.nw/...` 布局。official 模式同时提取 sharedMemory 依赖的 `smem.dll`，legacy 模式使用重建的 custom Windows module。
3. 受控补丁、安装脚本和展开包之间的漂移已经修复：`replace-skyline.sh` 现在幂等安装 preload、documentstart、Skyline 扩展和 Linux sharedMemory，并在 `SKYLINE=true` 时由 setup 流程调用；发布 client 仍需通过本地或新 release artifact 输入才能匹配 dialog API。
4. 展开包中的错误 `getWebContentsId` receiver 覆盖已经不再由受控补丁生成；Rust client 通过 RPC 调用 Wine webview 的真实方法。
5. 完整真实小程序 compile/route/raster 仍未验收。隔离 synthetic guest 已通过，真实项目目前被临时 profile 缺少 `access_token` 阻塞，不能把 synthetic 结果当作首屏渲染验收。
6. 当前 sharedMemory 有两种不兼容协议：官方 2.02 pair 是 raw Boost 文件，Linux v1.0.4 是 16 字节头文件。主实现选择重建的 custom Windows N-API module（legacy 模式），官方 pair 保留为显式诊断模式，禁止无意混用。
7. Wine RPC 的 accepted socket nonblocking 继承问题已经修复；旧现象 `Peer disconnected` 是分片帧被 `WouldBlock` 误判导致的，不是 dialog 本身。

### 2026-09-10 官方 sharedMemory 实测

1. `2.02.2608060` 安装包中的 `sharedMemory.node`（285696 字节）不是 v1.0.4 自带的同一实现：它是 N-API 薄封装，导入相邻的 `smem.dll`（60928 字节），并导出 `setMemory`、`getMemory`、`getMemoryByAddress`、`setMemoryByAddress`、`copyMemoryToBuffer` 和三个 cache 清理函数。只复制 `.node` 会在 Wine 中得到 `ERR_DLOPEN_FAILED`。
2. 官方 `setMemory(key, size)` 返回 16 字节 little-endian `{address:uint64, size:uint64}` 句柄，并在 `C:\ProgramData\boost_interprocess\01000000\<key>` 创建与 `size` 完全相同的原始文件；文件没有 v1.0.4 的 16 字节头。`getMemory` 与 `getMemoryByAddress` 返回副本，写入必须通过 `setMemoryByAddress(handle, buffer)`；`copyMemoryToBuffer(key, target)` 返回实际复制字节数。
3. 句柄地址是进程本地的，不能通过 RPC 传给另一个 Wine 进程；跨进程应传 key 并调用 `copyMemoryToBuffer`。在 Wine 前缀中把 `drive_c/ProgramData/boost_interprocess/01000000` 符号链接到 `/dev/shm` 后，官方读写文件可被 Linux 进程看到。前端实际 key 是 `skyline_${windowId}_${timestamp}`，因此 Linux 读取端需要优先尝试 `/dev/shm/<key>` 原始布局，不能只拼接 `/dev/shm/skyline_<key>.dat` 并解析旧头。
4. `skyline-client-server` 的提取器、prepare 和 Docker 流程已改为从 Electron-compatible 官方安装包（必要时独立 shared-memory archive）提取 `sharedMemory.node` 与 `smem.dll`；Wine 启动脚本会建立上述 `/dev/shm` 映射，并在模块探针中验证 `setMemoryByAddress` 与 `copyMemoryToBuffer`。
5. 官方 `copyMemoryToBuffer` 会缓存按 key 的映射和长度；同一个 key 重新 `setMemory` 后，必须先调用 `deleteCopyCache(key)` 才会看到新长度。`deleteSetCache(key)` 会使旧的进程内句柄失效，但不影响按 key 读取。
6. 服务端旧的 `DEVTOOLS_VERSION=2012510290` 指向 2.01 NW.js 安装包，其 `skyline.node` 和 `sharedMemory.node` 都导入 `nw.dll`/`node.dll`，不能在 Electron 36 加载。服务端构建参数已支持并默认切换到 2.02.2608060 直链；若保留旧 Skyline 资源，构建会在模块提取/加载验证阶段失败。
7. 重建 module 的功能证据比单一二进制 hash 更可靠：Linux API smoke、Wine Electron36 module probe、Windows->Linux pattern cross-read 和 SkylineShell descriptor acceptance 均通过；不同 GCC/spdlog 构建环境可能产生不同 hash，发布前应在同一 CI toolchain 重新生成并记录 checksum。

### 2026-09-10 Wine RPC 与 synthetic guest 实测

1. `packages/native/src/transport.rs` 对 accepted socket 显式恢复 blocking 模式，解决 Wine 下分片 RPC 帧触发 `WouldBlock` 后被误判为断开的问题。
2. 隔离 Electron 36.6 + Wine server 已加载 2.02 Skyline addon、重建 Windows sharedMemory 和 Rust `server.node`；模块 probe 验证 `SkylineShell`、sharedMemory 地址写入/按 key copy、RPC server start/stop。
3. Linux client 驱动 file guest 的成功输出已保存为 [`skyline-e2e-20260910.json`](../log/skyline-e2e-20260910.json)，并在默认 `3001/9222` 端口复验，覆盖 `getWebContentsId`、脚本结果 `ready`、同步 prompt 返回 `dialog-ok`、同一 webview target 和空错误列表。
4. 真实项目打开和 `skylineRenderEnable=true` 已确认；compile/route/raster 仍受登录 token 阻塞，当前完成门槛只覆盖 synthetic guest 和 native/shared-memory 链路。

### 2026-09-11 续跑审计

1. 当前工作树新增了游客态 `user.currentUser` 兼容：renderer preload 在 Skyline appservice 创建时保护本地 store，backend 补丁在 renderer service 代理边界提供同一回退；`replace-skyline.sh` 已把 backend 补丁纳入幂等安装输出。
2. 新增 `test/skyline-preload-dialog.test.js` 覆盖 wrapped dialog、handler 延迟注册、compile generation、游客用户回退、mount receiver 和 Linux/Wine webContents ID 隔离；本轮 `node --test` 为 7/7 通过，同时 `node --check`、`bash -n` 和 `git diff --check` 通过。
3. 当前展开包中的 Linux client 与 `skyline-client-server/packages/native/build/skyline.node` SHA-256 一致（`7f58aeb8...e682a0d`），说明受控 preload 正在配套当前本地 RPC client，而不是旧 release。
4. 2026-09-11 的独立 SkylineShell renderer 探针只能证明 addon 与共享内存可加载；它在未走真实 appservice create-window 协议时返回 `window_id: 1 not found`，不能作为 compile、route 或首屏栅格证据。
5. 审计时 `3001/9222` 均无监听进程。上一轮真实项目的最后权威结果仍是 CLI `41001`/需要重新登录；游客态补丁尚未经过一次新的完整运行验证，因此登录阻塞是否解除仍待复验。

### 后续任务

- [x] 修复并验证新版/旧版官方资源提取（含 `sharedMemory.node` + `smem.dll`）。
- [x] 让 `replace-skyline.sh` 幂等安装 preload、原生模块和 Skyline 扩展补丁。
- [x] 构建与当前 preload 协议匹配的 Linux client，并让安装脚本验证必需 API。
- [x] 消除首次 dialog 请求与 renderer handler 注册的竞态。
- [x] 把 server 的资源准备接回构建流程，并增加结构验证，缺文件时立即失败。
- [x] 构建并启动隔离 Wine server，验证 `SkylineShell`、Windows sharedMemory、`server.node` 三个模块可加载；当前运行证据保存在 `wx-compiler/tmp/skyline-e2e-20260910`。
- [ ] 运行真实 Skyline 测试小程序，验证 compile、route done、首屏共享内存栅格和输入事件；当前被 WeChat 登录票据 `41001` 阻塞。

当前执行顺序：先用现有游客态兼容补丁重跑真实项目并保存 renderer/Wine server/共享内存证据；若仍停在登录阶段，记录准确调用点和返回值；若越过登录，则继续定位首个未满足的 compile/route/raster/input gate。

每次分析或实施后，同步更新本文件和项目记忆 `~/.claude/projects/-home-msojocs-github-wechat-web-devtools-linux/memory/skyline-current-progress.md`。
