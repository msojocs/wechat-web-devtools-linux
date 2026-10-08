#!/bin/bash

# 构建自解压安装包：stub 脚本 + tar.gz payload 拼成单个 .sh 文件
#
# 用法（CI，tar.gz 已由 build-tar.sh 产出到 tmp/build）：
#   tools/build-installer.sh [版本] [架构]
# 用法（本地，直接用下载好的 tar.gz）：
#   tools/build-installer.sh [版本] [架构] --from-tar ~/下载/WeChat_Dev_Tools_*.tar.gz
# 附加：
#   --output FILE   指定输出路径（默认 tmp/build/<包名>_installer.sh）
#
# 产物示例：tmp/build/WeChat_Dev_Tools_v2.02.2608080-1_x86_64_linux_installer.sh
# 安装示例：
#   ./WeChat_Dev_Tools_*_installer.sh                     # 装到 ~/.local/share/wechat-devtools
#   ./WeChat_Dev_Tools_*_installer.sh --prefix /opt/wdt    # 指定目录（需写权限时自动 sudo）
#   ./WeChat_Dev_Tools_*_installer.sh --uninstall          # 卸载
#   ./WeChat_Dev_Tools_*_installer.sh --check              # 校验 payload 完整性

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
work_dir="$tmp_dir/installer"
mkdir -p "$store_dir" "$work_dir"

# ---- 参数解析 ----
FROM_TAR=""
OUTPUT_OVERRIDE=""
POSITIONAL=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --from-tar) FROM_TAR="$2"; shift 2 ;;
    --output) OUTPUT_OVERRIDE="$2"; shift 2 ;;
    *) POSITIONAL+=("$1"); shift ;;
  esac
done
set -- "${POSITIONAL[@]}"
if [ -n "$1" ]; then export VERSION="$1"; fi
if [ -n "$2" ]; then export ARCH="$2"; fi

if [[ "$WINE" == 'true' ]]; then TYPE='wine'; else TYPE='linux'; fi

# ---- 确定 payload（用包内 package.json 做版本检查，不解压整个包） ----
version_of_tar() {
  local tarfile="$1"
  local member
  member=$(tar -tzf "$tarfile" 2>/dev/null | grep -m1 'app.asar.unpacked/package.json$' || true)
  [[ -n "$member" ]] || return 1
  tar -xzOf "$tarfile" "$member" 2>/dev/null | node -p "JSON.parse(require('fs').readFileSync(0,'utf8')).version"
}

PAYLOAD=""
if [[ -n "$FROM_TAR" ]]; then
  [[ -f "$FROM_TAR" ]] || { fail "找不到 $FROM_TAR"; exit 1; }
  PAYLOAD="$FROM_TAR"
  DEVTOOLS_VERSION=$(version_of_tar "$PAYLOAD") || { fail "tar 包里找不到 app.asar.unpacked/package.json"; exit 1; }
else
  # CI 路径：仓库根目录应已有构建产物
  if [[ -f "$root_dir/resources/app.asar.unpacked/package.json" ]]; then
    DEVTOOLS_VERSION=$(node -p \
      "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8')).version" \
      "$root_dir/resources/app.asar.unpacked/package.json")
  else
    fail "仓库根目录没有构建产物，请先构建，或用 --from-tar 指定下载好的 tar.gz"
    exit 1
  fi
fi

notice "检查版本号（实际版本：$DEVTOOLS_VERSION）"
if [[ "$VERSION" == '' || "$VERSION" == 'continuous' ]]; then
  export VERSION="v${DEVTOOLS_VERSION}-continuous"
fi
INPUT_VERSION=$( echo "$VERSION" | sed 's/v//' | sed 's/-.*//' )
if [[ "$INPUT_VERSION" != "$DEVTOOLS_VERSION" ]]; then
  fail "传入版本号($INPUT_VERSION)与实际版本号($DEVTOOLS_VERSION)不一致！"
  exit 1
fi
if [[ "$ARCH" == '' ]]; then ARCH='x86_64'; fi

PACKAGE_NAME="WeChat_Dev_Tools_${VERSION}_${ARCH}_${TYPE}"
if [[ -z "$FROM_TAR" ]]; then
  PAYLOAD="$store_dir/${PACKAGE_NAME}.tar.gz"
  if [[ ! -f "$PAYLOAD" ]]; then
    notice "没有现成的 tar.gz，先执行 build-tar.sh"
    "$root_dir/tools/build-tar.sh" "$VERSION" "$ARCH"
  fi
fi
# payload 顶层必须是含 bin/electron/resources 的单一目录
TOP_DIR=$(tar -tzf "$PAYLOAD" | head -1 | cut -d/ -f1)
for d in bin electron resources; do
  tar -tzf "$PAYLOAD" "$TOP_DIR/$d/" >/dev/null 2>&1 || { fail "payload 缺少 $TOP_DIR/$d/"; exit 1; }
done

# ---- 把图标/desktop 模板追加进 payload（安装包自包含） ----
notice "准备安装用 payload（含图标）"
FULL_TAR="$work_dir/full.tar.gz"
cp "$PAYLOAD" "$FULL_TAR"
gunzip -f "$FULL_TAR"  # -> full.tar
ADD_DIR="$work_dir/add"
rm -rf "$ADD_DIR"
mkdir -p "$ADD_DIR/$TOP_DIR/share/icons" "$ADD_DIR/$TOP_DIR/share/applications"
cp "$root_dir"/res/icons/*.png "$ADD_DIR/$TOP_DIR/share/icons/"
cp "$root_dir/res/icons/wechat-devtools.svg" "$ADD_DIR/$TOP_DIR/share/icons/"
cp "$root_dir/res/template.desktop" "$ADD_DIR/$TOP_DIR/share/applications/template.desktop"
tar -rf "$work_dir/full.tar" -C "$ADD_DIR" "$TOP_DIR"
gzip -f "$work_dir/full.tar"
PAYLOAD_SHA256=$(sha256sum "$FULL_TAR" | cut -d' ' -f1)
OUTPUT="${OUTPUT_OVERRIDE:-$store_dir/${PACKAGE_NAME}_installer.sh}"

# ---- 生成 stub（quoted heredoc 防转义，构建期值用占位符替换） ----
notice "生成自解压安装包"
STUB="$work_dir/stub.sh"
cat > "$STUB" << 'STUB_EOF'
#!/bin/bash
# WeChat Dev Tools 自解压安装包
# 包名：@PKG_NAME@  sha256: @PAYLOAD_SHA256@
set -e
PKG_NAME="@PKG_NAME@"
PAYLOAD_SHA256="@PAYLOAD_SHA256@"
PAYLOAD_TOP="@PAYLOAD_TOP@"
MARKER="__WECHAT_DEVTOOLS_PAYLOAD_BELOW__"

usage() {
  echo "用法： $0 [选项]"
  echo "  --prefix DIR     安装到 DIR（默认：$HOME/.local/share/wechat-devtools）"
  echo "  --bindir DIR     可执行链接目录（默认：$HOME/.local/bin）"
  echo "  --no-desktop     不安装桌面图标"
  echo "  --force          覆盖已存在的安装"
  echo "  --uninstall      卸载（配合 --prefix 指定位置）"
  echo "  --check          校验内嵌 payload 完整性"
  echo "  -h/--help        显示帮助"
}

PREFIX="${PREFIX:-$HOME/.local/share/wechat-devtools}"
BINDIR=""
NO_DESKTOP=false
FORCE=false
ACTION="install"
FORWARD=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --prefix) PREFIX="$2"; FORWARD+=("--prefix" "$2"); shift 2 ;;
    --bindir) BINDIR="$2"; shift 2 ;;
    --no-desktop) NO_DESKTOP=true; FORWARD+=("--no-desktop"); shift ;;
    --force) FORCE=true; FORWARD+=("--force"); shift ;;
    --uninstall) ACTION="uninstall"; shift ;;
    --check) ACTION="check"; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "未知参数：$1"; usage; exit 1 ;;
  esac
done
if [[ -z "$BINDIR" ]]; then BINDIR="$HOME/.local/bin"; fi

payload_line() {
  awk -v m="$MARKER" '$0==m{print NR+1; exit}' "$0"
}
verify_payload() {
  echo "校验 payload sha256..."
  local actual
  actual=$(tail -n +"$(payload_line)" "$0" | sha256sum | cut -d' ' -f1)
  if [[ "$actual" != "$PAYLOAD_SHA256" ]]; then
    echo "校验失败！期望 $PAYLOAD_SHA256，实际 $actual"
    exit 1
  fi
  echo "校验通过"
}

if [[ "$ACTION" == "check" ]]; then
  verify_payload
  echo "包名：$PKG_NAME"
  exit 0
fi

MANIFEST="$PREFIX/.install-manifest"
if [[ "$ACTION" == "uninstall" ]]; then
  if [[ -f "$MANIFEST" ]]; then
    echo "卸载中..."
    tac "$MANIFEST" | while read -r f; do rm -f "$f"; done
    rm -rf "$PREFIX"
    echo "已卸载 $PREFIX"
  else
    echo "找不到安装记录 $MANIFEST，直接删除 $PREFIX"
    rm -rf "$PREFIX"
  fi
  exit 0
fi

# ---- install ----
if [[ -e "$PREFIX" && "$FORCE" != "true" ]]; then
  echo "已存在 $PREFIX，如需覆盖请加 --force，或先 --uninstall"
  exit 1
fi
if [[ ! -w "$(dirname "$PREFIX")" && "$(id -u)" != "0" ]] && command -v sudo >/dev/null 2>&1; then
  echo "需要管理员权限，尝试 sudo..."
  exec sudo -E "$0" "${FORWARD[@]}" --bindir "$BINDIR" --force
fi
verify_payload
STAGE=$(mktemp -d)
trap 'rm -rf "$STAGE"' EXIT
tail -n +"$(payload_line)" "$0" | tar -xz -C "$STAGE"
mkdir -p "$PREFIX"
cp -a "$STAGE/$PAYLOAD_TOP/." "$PREFIX/"
rm -f "$PREFIX/electron/node" "$PREFIX/electron/node.exe" "$PREFIX/electron/node-18.exe"

: > "$MANIFEST"
mkdir -p "$BINDIR"
ln -sf "$PREFIX/bin/wechat-devtools" "$BINDIR/wechat-devtools"
ln -sf "$PREFIX/bin/wechat-devtools-cli" "$BINDIR/wechat-devtools-cli"
echo "$BINDIR/wechat-devtools" >> "$MANIFEST"
echo "$BINDIR/wechat-devtools-cli" >> "$MANIFEST"

if [[ "$NO_DESKTOP" != "true" ]]; then
  APP_DIR="$HOME/.local/share/applications"
  ICON_BASE="$HOME/.local/share/icons/hicolor"
  mkdir -p "$APP_DIR"
  sed -e "s#^Exec=.*#Exec=$PREFIX/bin/wechat-devtools %U#" \
      -e "s#^Icon=.*#Icon=wechat-devtools#" \
      "$PREFIX/share/applications/template.desktop" > "$APP_DIR/wechat-devtools.desktop"
  echo "$APP_DIR/wechat-devtools.desktop" >> "$MANIFEST"
  for s in 16 32 48 64 128 256 512; do
    if [[ -f "$PREFIX/share/icons/${s}x${s}.png" ]]; then
      mkdir -p "$ICON_BASE/${s}x${s}/apps"
      cp -f "$PREFIX/share/icons/${s}x${s}.png" "$ICON_BASE/${s}x${s}/apps/wechat-devtools.png"
      echo "$ICON_BASE/${s}x${s}/apps/wechat-devtools.png" >> "$MANIFEST"
    fi
  done
  if [[ -f "$PREFIX/share/icons/wechat-devtools.svg" ]]; then
    mkdir -p "$ICON_BASE/scalable/apps"
    cp -f "$PREFIX/share/icons/wechat-devtools.svg" "$ICON_BASE/scalable/apps/wechat-devtools.svg"
    echo "$ICON_BASE/scalable/apps/wechat-devtools.svg" >> "$MANIFEST"
  fi
  command -v update-desktop-database >/dev/null 2>&1 && update-desktop-database "$APP_DIR" || true
fi

echo "安装完成：$PREFIX"
echo "启动：$BINDIR/wechat-devtools"
exit 0
STUB_EOF

sed -i -e "s/@PKG_NAME@/${PACKAGE_NAME}/" \
       -e "s/@PAYLOAD_SHA256@/${PAYLOAD_SHA256}/" \
       -e "s|@PAYLOAD_TOP@|${TOP_DIR}|" \
       "$STUB"

# ---- 拼接：stub + marker + payload ----
cp "$STUB" "$OUTPUT"
printf '%s\n' "__WECHAT_DEVTOOLS_PAYLOAD_BELOW__" >> "$OUTPUT"
cat "$FULL_TAR" >> "$OUTPUT"
chmod +x "$OUTPUT"
success "安装包：$OUTPUT"
ls -lh "$OUTPUT"
