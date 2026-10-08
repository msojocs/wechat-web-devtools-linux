#!/bin/bash

# 构建 Flatpak 包：直接打包已构建好的 bin/electron/resources，不重新编译
#
# 用法（CI，构建产物在仓库根目录）：
#   tools/build-flatpak.sh [版本] [架构]
# 用法（本地，用下载好的官方构建 tar.gz / 已解压目录）：
#   tools/build-flatpak.sh [版本] [架构] --from-tar ~/下载/WeChat_Dev_Tools_*.tar.gz
#   tools/build-flatpak.sh [版本] [架构] --from-dir ~/下载/WeChat_Dev_Tools_*_linux
# 附加：
#   --stage-only   只准备 tmp/flatpak（payload.tar.gz + manifest），不调用 flatpak-builder
#   --install      构建后安装到当前用户的 flatpak
#
# 产物：tmp/build/WeChat_Dev_Tools_<版本>_<架构>_<类型>.flatpak

set -e
notice() {
    echo -e "\033[36m $1 \033[0m "
}
fail() {
    echo -e "\033[41;37m 失败 \033[0m $1"
}
success() {
    echo -e "\033[42;37m 成功 \033[0m $1"
}

root_dir=$(cd "$(dirname "$0")/.." && pwd -P)
tmp_dir="$root_dir/tmp"
store_dir="$tmp_dir/build"
work_dir="$tmp_dir/flatpak"
stage_dir="$work_dir/export"
mkdir -p "$store_dir" "$work_dir"

# ---- 参数解析 ----
FROM_TAR=""
FROM_DIR=""
STAGE_ONLY=false
INSTALL_FLAG=false
POSITIONAL=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --from-tar) FROM_TAR="$2"; shift 2 ;;
    --from-dir) FROM_DIR="$2"; shift 2 ;;
    --stage-only) STAGE_ONLY=true; shift ;;
    --install) INSTALL_FLAG=true; shift ;;
    *) POSITIONAL+=("$1"); shift ;;
  esac
done
set -- "${POSITIONAL[@]}"
if [ -n "$1" ]; then export VERSION="$1"; fi
if [ -n "$2" ]; then export ARCH="$2"; fi

if [[ "$WINE" == 'true' ]]; then
  fail "Flatpak 不支持 wine 版本"
  exit 1
fi
TYPE='linux'
APP_ID="io.github.msojocs.wechat_devtools"

# ---- 确定构建来源 ----
SRC_DIR="$root_dir"
if [[ -n "$FROM_TAR" && -n "$FROM_DIR" ]]; then
  fail "--from-tar 和 --from-dir 只能指定一个"
  exit 1
fi
if [[ -n "$FROM_TAR" ]]; then
  [[ -f "$FROM_TAR" ]] || { fail "找不到 $FROM_TAR"; exit 1; }
  notice "从 tar.gz 解出构建来源"
  rm -rf "$work_dir/payload-src"
  mkdir -p "$work_dir/payload-src"
  tar -zxf "$FROM_TAR" -C "$work_dir/payload-src"
  # tar 包顶层是 WeChat_Dev_Tools_*/ 目录，自动定位含 bin/ 的那层
  SRC_DIR=$(find "$work_dir/payload-src" -maxdepth 2 -type d -name bin -printf '%h\n' | head -1)
  [[ -n "$SRC_DIR" ]] || { fail "tar 包里找不到 bin/ 目录"; exit 1; }
elif [[ -n "$FROM_DIR" ]]; then
  [[ -d "$FROM_DIR" ]] || { fail "找不到目录 $FROM_DIR"; exit 1; }
  SRC_DIR="$FROM_DIR"
fi
for d in bin electron resources; do
  [[ -d "$SRC_DIR/$d" ]] || { fail "构建来源缺少 $d/ : $SRC_DIR"; exit 1; }
done
[[ -x "$SRC_DIR/electron/electron" ]] || { fail "缺少 $SRC_DIR/electron/electron"; exit 1; }
[[ -f "$SRC_DIR/resources/app.asar" ]] || { fail "缺少 $SRC_DIR/resources/app.asar"; exit 1; }

# ---- 版本检查 ----
notice "检查版本号"
DEVTOOLS_VERSION=$(node -p \
  "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8')).version" \
  "$SRC_DIR/resources/app.asar.unpacked/package.json")
if [[ "$VERSION" == '' || "$VERSION" == 'continuous' ]]; then
  export VERSION="v${DEVTOOLS_VERSION}-continuous"
fi
INPUT_VERSION=$( echo "$VERSION" | sed 's/v//' | sed 's/-.*//' )
if [[ "$INPUT_VERSION" != "$DEVTOOLS_VERSION" ]]; then
  fail "传入版本号($INPUT_VERSION)与实际版本号($DEVTOOLS_VERSION)不一致！"
  exit 1
fi
if [[ "$ARCH" == '' ]]; then ARCH='x86_64'; fi

# ---- staging：/app 下的文件树 ----
notice "准备 staging ($SRC_DIR -> $stage_dir)"
rm -rf "$stage_dir"
mkdir -p "$stage_dir"
cp -a "$SRC_DIR/bin" "$SRC_DIR/electron" "$SRC_DIR/resources" "$stage_dir/"
# 清理旧构建遗留的 Node，运行时由 bin/node 使用 Electron 提供
rm -f "$stage_dir/electron/node" "$stage_dir/electron/node.exe" "$stage_dir/electron/node-18.exe"
# flatpak 入口（command），与 bin/ 下真实脚本不同名，避免递归
install -Dm755 "$root_dir/res/flatpak/startup.sh" "$stage_dir/bin/startup.sh"

notice "生成 desktop / metainfo / icons"
mkdir -p "$stage_dir/share/applications" "$stage_dir/share/metainfo"
for size in 16x16 32x32 48x48 64x64 96x96 128x128 256x256 512x512; do
  install -Dm644 "$root_dir/res/icons/${size}.png" "$stage_dir/share/icons/hicolor/${size}/apps/${APP_ID}.png"
done
install -Dm644 "$root_dir/res/icons/wechat-devtools.svg" "$stage_dir/share/icons/hicolor/scalable/apps/${APP_ID}.svg"

cat > "$stage_dir/share/applications/${APP_ID}.desktop" << EOF
[Desktop Entry]
Name=WeChat Dev Tools
Name[zh_CN]=微信开发者工具
Comment=The development tools for wechat projects
Comment[zh_CN]=提供微信开发相关项目的开发IDE支持
Categories=Development;WebDevelopment;IDE;
Exec=startup.sh %U
Icon=${APP_ID}
Type=Application
Terminal=false
StartupWMClass=wechat-devtools
MimeType=x-scheme-handler/wechatide
EOF

cat > "$stage_dir/share/metainfo/${APP_ID}.metainfo.xml" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<component type="desktop-application">
  <id>${APP_ID}</id>
  <name>WeChat Dev Tools</name>
  <name xml:lang="zh_CN">微信开发者工具</name>
  <summary>The development tools for wechat projects</summary>
  <summary xml:lang="zh_CN">提供微信开发相关项目的开发IDE支持</summary>
  <description>
    <p>WeChat DevTools for Linux: develop, debug and preview WeChat Mini Programs.</p>
    <p xml:lang="zh_CN">Linux 下的微信开发者工具：开发、调试和预览微信小程序。</p>
  </description>
  <metadata_license>MIT</metadata_license>
  <project_license>LicenseRef-proprietary</project_license>
  <url type="homepage">https://github.com/msojocs/wechat-web-devtools-linux</url>
  <developer>
    <name>msojocs</name>
  </developer>
  <launchable type="desktop-id">${APP_ID}.desktop</launchable>
  <releases>
    <release version="${INPUT_VERSION}" date="$(date -u +%Y-%m-%d)"/>
  </releases>
  <content_rating type="oars-1.1"/>
</component>
EOF

# ---- payload 归档 + manifest ----
# 注意：flatpak-builder 解 archive source 时默认 strip 一层顶目录（已实测），
# 因此 payload 里包一层 app/，strip 后构建根目录即 bin/electron/resources/share
notice "打包 payload + 生成 manifest"
rm -rf "$work_dir/pkgroot"
mkdir -p "$work_dir/pkgroot/app"
cp -a "$stage_dir/." "$work_dir/pkgroot/app/"
tar -zcf "$work_dir/payload.tar.gz" -C "$work_dir/pkgroot" app
cat > "$work_dir/${APP_ID}.yaml" << EOF
app-id: ${APP_ID}
runtime: org.freedesktop.Platform
runtime-version: '23.08'
sdk: org.freedesktop.Sdk
command: startup.sh
finish-args:
  - --share=ipc
  - --socket=x11
  - --socket=wayland
  - --device=dri
  - --filesystem=home
  - --filesystem=xdg-download:rw
  - --filesystem=xdg-documents:rw
  - --filesystem=xdg-pictures:rw
  - --share=network
  - --talk-name=org.freedesktop.Notifications
  - --talk-name=org.kde.StatusNotifierWatcher
  - --talk-name=org.freedesktop.FileManager1
  - --own-name=${APP_ID}
modules:
  - name: wechat-devtools
    buildsystem: simple
    build-commands:
      - mkdir -p /app
      - cp -a bin electron resources share /app/
      - chmod +x /app/bin/startup.sh
      - chmod 4755 /app/electron/chrome-sandbox || true
    sources:
      - type: archive
        path: payload.tar.gz
EOF

if [[ "$STAGE_ONLY" == 'true' ]]; then
  success "staging 就绪：$stage_dir"
  success "manifest：$work_dir/${APP_ID}.yaml"
  exit 0
fi

command -v flatpak-builder >/dev/null 2>&1 || { fail "未找到 flatpak-builder，请先安装：yay -S flatpak-builder"; exit 1; }

notice "检查 Flatpak runtime"
RUNTIMES=$(flatpak list --user --runtime 2>/dev/null || true)
if ! echo "$RUNTIMES" | grep -q "org.freedesktop.Platform.*23.08" || \
   ! echo "$RUNTIMES" | grep -q "org.freedesktop.Sdk.*23.08"; then
  notice "下载 org.freedesktop.Platform//23.08 + Sdk（仅首次，约 1GB）"
  flatpak remotes --user 2>/dev/null | grep -q '^flathub' || \
    flatpak remote-add --user flathub https://dl.flathub.org/repo/flathub.flatpakrepo
  flatpak install -y --user flathub org.freedesktop.Platform//23.08 org.freedesktop.Sdk//23.08
fi

notice "BUILD Flatpak"
cd "$work_dir"
flatpak-builder --force-clean \
  --repo="$work_dir/repo" \
  "$work_dir/build" \
  "$work_dir/${APP_ID}.yaml"

if [[ "$INSTALL_FLAG" == 'true' ]]; then
  notice "安装到用户 Flatpak"
  flatpak install -y --user "$work_dir/repo" "$APP_ID"
fi

notice "导出单文件 .flatpak"
flatpak build-bundle "$work_dir/repo" \
  "$store_dir/WeChat_Dev_Tools_${VERSION}_${ARCH}_${TYPE}.flatpak" \
  "$APP_ID"
success "Flatpak 包：$store_dir/WeChat_Dev_Tools_${VERSION}_${ARCH}_${TYPE}.flatpak"
