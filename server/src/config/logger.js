const {isDev} = require("./config");
const colours = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    underscore: '\x1b[4m',
    blink: '\x1b[5m',
    reverse: '\x1b[7m',
    hidden: '\x1b[8m',

    fg: Object.fromEntries([
        ['black', 30], ['red', 31], ['green', 32], ['yellow', 33], ['blue', 34], ['magenta', 35], ['cyan', 36], ['white', 37], ['crimson', 38]
    ].map(([key, code]) => [key, `\x1b[${code}m`])),

    bg: Object.fromEntries([
        ['black', 40], ['red', 41], ['green', 42], ['yellow', 43], ['blue', 44], ['magenta', 45], ['cyan', 46], ['white', 47], ['crimson', 48]
    ].map(([key, code]) => [key, `\x1b[${code}m`])),
};

const getCallingFunction = (error = new Error()) => {
    const match = error.stack?.split('\n')[4]?.match(/\bat\s(\w+)/);
    return match ? match[1].toUpperCase() : '--';
};

const formatLog = (level, color, message, ...params) => {
    if (!isDev) return;
    console[level](
        `[${new Date().toLocaleString()}]`,
        colours.fg[color], `[${level.toUpperCase()}]`, colours.reset,
        colours.bg.black, `[${getCallingFunction()}]`, colours.reset,
        message, ...params
    );
};

const log = (msg, ...params) => console.log(`[${new Date().toLocaleString()}]`, colours.fg.magenta, '[SERVER-LOG]', colours.reset, msg, ...params);
const info = (msg, ...params) => formatLog('info', 'cyan', msg, ...params);
const warn = (msg, ...params) => formatLog('warn', 'yellow', msg, ...params);
const error = (msg, ...params) => formatLog('error', 'red', msg, ...params);

module.exports = {log, info, warn, error};
