const path = require('node:path');
const os = require('node:os');
const { spawn } = require('node:child_process');

const TAURI_DRIVER = path.join(os.homedir(), '.cargo', 'bin', 'tauri-driver');
const BINARY = path.join(__dirname, '..', 'target', 'release', 'app');

let tauriDriver;

exports.config = {
    runner: 'local',
    maxInstances: 1,

    specs: [
        './tests/walkthrough1.test.js',
        './tests/walkthrough2.test.js',
        './tests/walkthrough3.test.js',
    ],

    capabilities: [{
        maxInstances: 1,
        'tauri:options': { application: BINARY },
    }],

    framework: 'mocha',
    mochaOpts: { ui: 'bdd', timeout: 120_000 },
    reporters: ['spec'],

    hostname: '127.0.0.1',
    port: 4444,
    path: '/',

    onPrepare() {
        tauriDriver = spawn(TAURI_DRIVER, [], { stdio: 'inherit' });
    },
    onComplete() {
        tauriDriver?.kill();
    },
};
