
const args = process.argv.slice(2);
const { exit } = require("process");
const config = require("../conf/config.json");


// 16.17.0后可以使用util.parseArgs，目前是16.11.0
const options = {
    '--arch': {
        type: 'string',
    },
    '--get-arch': {
        type: 'boolean',
    },
    '--get-nwjs-url': {
        type: 'boolean',
    },
    '--get-nwjs-version': {
        type: 'boolean',
    },
    '--get-node-url': {
        type: 'boolean',
    },
    '--get-node-version': {
        type: 'boolean',
    },
    '--get-compiler-prefix': {
        type: 'boolean',
    },
    '--get-compiler-version': {
        type: 'boolean',
    },
    '--get-devtools-url': {
        type: 'boolean',
    },
    '--get-devtools-version': {
        type: 'boolean',
    },
}
const configArg = {
    arch: process.arch,
}
for (let i = 0; i < args.length; i++) {
    if (options[args[i]]) {
        if (options[args[i]].type === 'string') {
            i++;
            if (i < args.length) {
                if (args[i - 1] === '--arch') {
                    if (args[i] === 'x64' || args[i] === 'loongarch64') {
                        configArg.arch = args[i];
                    } else {
                        console.error(`Invalid value for option --arch: ${args[i]}`);
                        exit(1);
                    }
                }
            } else {
                console.error(`Missing value for option: ${args[i - 1]}`);
                exit(1);
            }
        } else if (options[args[i]].type === 'boolean') {
            configArg[args[i].substring(2)] = true;
        }
    }
}

if (configArg['get-arch']) {
    console.log(configArg.arch);
    exit(0);
}

if (configArg['get-nwjs-url']) {
    console.log(config.nwjs.urls[configArg.arch].template.replace(/\${version}/g, config.nwjs.urls[configArg.arch].version));
    exit(0);
}

if (configArg['get-nwjs-version']) {
    console.log(config.nwjs.urls[configArg.arch].version);
    exit(0);
}

if (configArg['get-node-url']) {
    console.log(config.node.urls[configArg.arch].template.replace(/\${version}/g, config.node.urls[configArg.arch].version));
    exit(0);
}

if (configArg['get-node-version']) {
    console.log(config.node.urls[configArg.arch].version);
    exit(0);
}

if (configArg['get-compiler-prefix']) {
    console.log(config.compiler.template.replace(/\${version}/g, config.compiler.version));
    exit(0);
}

if (configArg['get-compiler-version']) {
    console.log(config.compiler.version);
    exit(0);
}

if (configArg['get-devtools-url']) {
    console.log(config.devtools.template.replace(/\${version}/g, config.devtools.version));
    exit(0);
}

if (configArg['get-devtools-version']) {
    console.log(config.devtools.version);
    exit(0);
}