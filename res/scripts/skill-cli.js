// Run the upstream bundle with Linux paths and named authorization exports.
const path = require('node:path');
const os = require('node:os');
const { runSkillAuth, startSkillAuth } = require('./skill-auth');

let userDataRoot;
Object.defineProperty(global, 'electronUserDirPathRoot', {
    configurable: true,
    set() {
        userDataRoot = path.join(process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config'),
            global.userDirName, global.productHash);
    },
    get() { return userDataRoot; },
});

const define = Object.defineProperty;
const watched = [];
let authCaptured = false;
let startCaptured = false;
let emitSkillCallFailure;

function restore() {
    Object.defineProperty = define;
    for (const [target, key, setter] of watched) {
        if (Object.getOwnPropertyDescriptor(target, key)?.set === setter) delete target[key];
    }
}
function watch(target, key, accept) {
    if (Object.hasOwn(target, key)) return;
    const setter = value => {
        define(target, key, {
            value: accept(value), writable: true, enumerable: true, configurable: true,
        });
        if (authCaptured && startCaptured && emitSkillCallFailure) restore();
    };
    define(target, key, { set: setter, configurable: true });
    watched.push([target, key, setter]);
}
// Only observe CommonJS export initialization, then restore the native API.
// No bundle module IDs, local variable names, or source text are inspected.
Object.defineProperty = function(target, key, descriptor) {
    const result = define(target, key, descriptor);
    if (key === '__esModule' && descriptor.value === true) {
        if (!authCaptured) watch(target, 'runSkillAuth', original => {
            if (typeof original !== 'function' || typeof target.parseSkillAuthArgs !== 'function') return original;
            authCaptured = true;
            watch(target, 'startSkillAuth', originalStart => {
                if (typeof originalStart !== 'function') throw new Error('Unsupported wechatide auth exports');
                startCaptured = true;
                return options => startSkillAuth(options, { emitSkillCallFailure });
            });
            return runSkillAuth;
        });
        if (!emitSkillCallFailure) watch(target, 'emitSkillCallFailure', original => {
            if (typeof original === 'function') emitSkillCallFailure = original;
            return original;
        });
    }
    return result;
};

// Remove this wrapper from argv so the bundled CLI sees its normal arguments.
process.argv.splice(1, 1);
try {
    require(path.resolve(process.argv[1]));
    if (!authCaptured || !startCaptured || !emitSkillCallFailure) {
        throw new Error('Unsupported wechatide auth exports; update the Linux adapter');
    }
} finally {
    restore();
}
