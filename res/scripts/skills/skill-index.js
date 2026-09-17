// resources/app.asar.unpacked/js/common/cli/skill-index.js
{
    const spwan = require('child_process').spawn;
    require('child_process').spawn = function(command, args, options) {
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
    Object.defineProperty(global, 'electronUserDirPathRoot', {
        set(value) {
            if (value?.includes('AppData/Local')) {
                value = value.replace('AppData/Local', '.config');
                value = value.replace('User Data/', '');
            }
            this._electronUserDirPathRoot = value;
        },
        get() {
            return this._electronUserDirPathRoot;
        }
    });
}
