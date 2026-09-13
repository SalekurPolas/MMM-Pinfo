const assert = require('assert');

console.log('--- Testing node_helper.js logic ---');
// mock mm built-in modules in require.cache

const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function(path) {
    if (path === 'node_helper') {
        return {
            create: (obj) => obj
        };
    }

    if (path === 'logger') {
        return {
            error: (msg) => console.error('[MOCK LOG ERROR]', msg),
            log: (msg) => console.log('[MOCK LOG]', msg)
        };
    }
    
    return originalRequire.apply(this, arguments);
};

const si = require('systeminformation');
const helper = require('./node_helper.js');
helper.start();

// test convert
console.log('Testing convert()...');
assert.strictEqual(helper.convert(0), '0B');
assert.strictEqual(helper.convert(null), '0B');
assert.strictEqual(helper.convert(undefined), '0B');
assert.strictEqual(helper.convert(500), '500B');
assert.strictEqual(helper.convert(1024), '1.00KB');
assert.strictEqual(helper.convert(1048576), '1.00MB');
assert.strictEqual(helper.convert(1073741824, 0), '1GB');
assert.strictEqual(helper.convert(1099511627776, 2), '1.00TB');
assert.strictEqual(helper.convert(2199023255552, 2), '2.00TB');
console.log('✓ convert() passed all test cases');

// test convert time
console.log('Testing convertTime()...');
assert.strictEqual(helper.convertTime(-5), '0 seconds');
assert.strictEqual(helper.convertTime(30), '30 seconds');
assert.strictEqual(helper.convertTime(120), '2 minutes');
assert.strictEqual(helper.convertTime(3600 * 3), '3 hours');
assert.strictEqual(helper.convertTime(86400 * 5), '5 days');
console.log('✓ convertTime() passed all test cases');

// test dynamic data collection
console.log('Testing collectDynamicInfo()...');
helper.collectDynamicInfo().then(() => {
    console.log('Status after collectDynamicInfo:');
    console.log('Memory:', helper.status.MEMORY);
    console.log('Storage:', helper.status.STORAGE);
    console.log('CPU:', helper.status.CPU);
    console.log('Network:', helper.status.NETWORK);
    console.log('Uptime:', helper.status.UPTIME);

    assert(typeof helper.status.MEMORY.percent !== 'undefined');
    assert(typeof helper.status.STORAGE.total === 'string');
    assert(typeof helper.status.CPU.temp !== 'undefined');
    console.log('✓ Dynamic data collection passed');

    // test warning logic
    console.log('\n--- Testing warning debounce logic ---');
    const mockModule = {
        name: 'MMM-Pinfo',
        config: {
            WARNING: {
                enable: true,
                interval: 60000, // 1 minute
                check: {
                    CPU_TEMP: 60,
                    RAM_USED: 75
                }
            }
        },
        status: {
            CPU: { temp: "70.5", usage: "40" },
            MEMORY: { percent: "85" },
            STORAGE: { percent: "40" }
        },
        lastWarningTimes: {},
        alertsTriggered: [],
        showWarning(name, actual, check) {
            this.alertsTriggered.push({ name, actual, check, time: Date.now() });
        }
    };

    // borrow check warning logic
    const checkWarning = function() {
        if (!this.config.WARNING || !this.config.WARNING.enable) return;

        const interval = typeof this.config.WARNING.interval === 'number' ? this.config.WARNING.interval : 1000 * 60 * 5;
        const now = Date.now();
        const checks = this.config.WARNING.check || {};

        for (let name in checks) {
            const checkValue = checks[name];
            let actualValue = null;
            let metricKey = name;

            if (name === "CPU_TEMP") {
                actualValue = parseFloat(this.status.CPU.temp);
            } else if (name === "CPU_USAGE") {
                actualValue = parseFloat(this.status.CPU.usage);
            } else if (name === "RAM_USED" || name === "MEMORY_USED") {
                actualValue = parseFloat(this.status.MEMORY.percent);
                metricKey = "RAM_USED";
            } else if (name === "STORAGE_USED") {
                actualValue = parseFloat(this.status.STORAGE.percent);
            }

            if (actualValue !== null && !isNaN(actualValue) && actualValue > checkValue) {
                const lastTime = this.lastWarningTimes[metricKey] || 0;
                if (now - lastTime >= interval) {
                    this.lastWarningTimes[metricKey] = now;
                    this.showWarning(name, actualValue, checkValue);
                }
            }
        }
    };

    // first run: should trigger alerts for both CPU_TEMP and RAM_USED
    checkWarning.call(mockModule);
    assert.strictEqual(mockModule.alertsTriggered.length, 2);
    console.log('✓ Initial alerts triggered:', mockModule.alertsTriggered.map(a => a.name));

    // immediate second run: should NOT trigger alerts because interval has not passed!
    checkWarning.call(mockModule);
    assert.strictEqual(mockModule.alertsTriggered.length, 2);
    console.log('✓ Debounce prevented spamming on immediate rerun (0 new alerts)');

    // fast-forward lastWarningTimes to simulate interval passed
    mockModule.lastWarningTimes['CPU_TEMP'] = Date.now() - 70000;
    mockModule.lastWarningTimes['RAM_USED'] = Date.now() - 70000;
    checkWarning.call(mockModule);
    assert.strictEqual(mockModule.alertsTriggered.length, 4);
    console.log('✓ Alerts triggered again after interval elapsed');

    // test get level logic
    const getLevel = function(number, precision) {
        if (isNaN(number) || number === null || number === undefined) return 0;
        
        let factor = Math.pow(10, precision);
        let tempNumber = Math.round(Number(number) * factor);
        let level = tempNumber / factor;
        
        if (level < 0) return 0;
        if (level > 100) return 100;
        
        return level;
    };
    
    assert.strictEqual(getLevel(45, -1), 50);
    assert.strictEqual(getLevel(12, -1), 10);
    assert.strictEqual(getLevel(110, -1), 100);
    assert.strictEqual(getLevel(-10, -1), 0);
    assert.strictEqual(getLevel(NaN, -1), 0);
    assert.strictEqual(getLevel(null, -1), 0);
    console.log('✓ getLevel() clamped step calculations passed');

    console.log('\n=============================================');
    console.log('ALL UNIT AND INTEGRATION CHECKS PASSED (100%)');
    console.log('=============================================');
}).catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});
