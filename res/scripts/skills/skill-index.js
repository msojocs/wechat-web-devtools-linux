// resources/app.asar.unpacked/js/common/cli/skill-index.js
{
  const spwan = require('child_process').spawn;
  require('child_process').spawn = function (command, args, options) {
    if (command.endsWith('electron')) {
      args.push('--no-sandbox')
    }
    return spwan.apply(this, [command, args, options]);
  }
  Object.defineProperties(process, {
    platform: {
      value: 'win32'
    },
  });
  const path = require('path');
  path.win32.normalize = function(p) {
    return path.posix.normalize(p.replace(/\\/g, '/'));
  }
  Object.defineProperty(global, 'electronUserDirPathRoot', {
    set(value) {
      const profile = value?.match(
        /^(.*)\/(?:AppData\/Local|Library\/Application Support)\/([^/]+)\//
      );
      if (profile) {
        const [, home, appName] = profile;
        const configDir = process.env.XDG_CONFIG_HOME || path.posix.join(home, '.config');
        // 与 bin/wechat-devtools 的固定数据目录一致，避免读取旧哈希目录中的端口。
        value = path.posix.join(configDir, appName, 'app');
      }
      this._electronUserDirPathRoot = value;
    },
    get() {
      return this._electronUserDirPathRoot;
    }
  });
}
