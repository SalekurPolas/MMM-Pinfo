'use strict';

const si = require('systeminformation');
const NodeHelper = require('node_helper');
const Log = require('logger');
const { exec } = require('child_process');

module.exports = NodeHelper.create({
    start() {
        this.config = {};
        this.timer = null;
        this.isSuspended = false;

        this.status = {
          DEVICE: {
            model: 'unknown',
            serial: 'unknown',
            throttled: null
          },
          OS: 'unknown',
          NETWORK: {
            type: 'unknown',
            ipv4: 'unknown',
            ipv6: 'unknown',
            mac: 'unknown',
            ping: 'unknown'
          },
          MEMORY: {
            total: 0,
            used: 0,
            percent: 0
          },
          STORAGE: {
            total: 0,
            used: 0,
            percent: 0
          },
          CPU: {
            type: 'unknown',
            usage: 0,
            temp: 0
          },
          UPTIME: 'unknown'
        };
    },

    socketNotificationReceived(notification, payload) {
        if (notification === "CONFIG") {
            this.config = payload;
            this.isSuspended = false;
            this.collectStaticInfo();
        } else if (notification === "SUSPEND") {
            this.isSuspended = true;
            
            if (this.timer) {
                clearTimeout(this.timer);
                this.timer = null;
            }
        } else if (notification === "RESUME") {
            if (this.isSuspended) {
                this.isSuspended = false;
                this.scheduler();
            }
        }
    },

    async collectStaticInfo() {
        await Promise.allSettled([
            this.getDeviceInfo(),
            this.getOSInfo(),
            this.getCPUType()
        ]);

        this.scheduler();
    },

    async scheduler() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }

        if (this.isSuspended) {
            return;
        }

        await this.collectDynamicInfo();

        this.sendSocketNotification('STATUS', this.status);

        if (!this.isSuspended) {
            this.timer = setTimeout(() => {
                this.scheduler();
            }, this.config.refresh || 5000);
        }
    },

    async collectDynamicInfo() {
        await Promise.allSettled([
            this.getNetworkInfo(),
            this.getNetworkPing(),
            this.getMemoryInfo(),
            this.getStorageInfo(),
            this.getCPUInfo(),
            this.getUptime(),
            this.getPiThrottle()
        ]);
    },

    getUptime() {
        try {
            this.status['UPTIME'] = this.convertTime(si.time().uptime);
        } catch (error) {
            Log.error(`Error while getting uptime: ${error}`);
        }
    },

    async getDeviceInfo() {
        try {
            const data = await si.system();
            this.status['DEVICE'].model = data.model || 'unknown';
            this.status['DEVICE'].serial = data.serial || 'unknown';
        } catch (error) {
            Log.error(`Error while getting device info: ${error}`);
        }
    },

    async getOSInfo() {
        try {
            const data = await si.osInfo();
            const distro = (data.distro || '').split(' ')[0];
            const release = data.release || '';
            const codename = data.codename ? ` (${data.codename})` : '';
            this.status['OS'] = `${distro} ${release}${codename}`.trim() || 'unknown';
        } catch (error) {
            Log.error(`Error while getting OS info: ${error}`);
        }
    },

    async getNetworkInfo() {
        try {
            const defaultInt = await si.networkInterfaceDefault().catch(() => null);
            const data = await si.networkInterfaces();

            if (Array.isArray(data)) {
                let net = null;
                if (defaultInt) {
                    net = data.find(item => item.iface !== 'lo' && item.iface === defaultInt);
                }
                if (!net) {
                    net = data.find(item => item.iface !== 'lo' && (item.ip4 || item.ip6));
                }

                if (net) {
                    this.status['NETWORK'].type = net.iface || 'unknown';
                    this.status['NETWORK'].ipv4 = net.ip4 || 'N/A';
                    this.status['NETWORK'].ipv6 = net.ip6 || 'N/A';
                    this.status['NETWORK'].mac = net.mac || 'unknown';
                }
            }
        } catch (error) {
            Log.error(`Error while getting network info: ${error}`);
        }
    },

    async getNetworkPing() {
        if (!this.config.NETWORK || !this.config.NETWORK.displayPing) {
            return;
        }

        try {
            const host = this.config.NETWORK.pingHost || null;
            const latency = await si.inetLatency(host);

            if (typeof latency === 'number' && latency >= 0) {
                this.status['NETWORK'].ping = Math.round(latency) + 'ms';
            } else {
                this.status['NETWORK'].ping = 'Offline';
            }
        } catch (error) {
            this.status['NETWORK'].ping = 'Offline';
        }
    },

    async getMemoryInfo() {
        try {
            const data = await si.mem();

            if (data && data.total > 0) {
                const usedBytes = Math.max(0, (data.used || 0) - (data.buffcache || 0));
                this.status['MEMORY'].total = this.convert(data.total, 0);
                this.status['MEMORY'].used = this.convert(usedBytes, 2);
                this.status['MEMORY'].percent = ((usedBytes / data.total) * 100).toFixed(0);
            }
        } catch (error) {
            Log.error(`Error while getting memory info: ${error}`);
        }
    },

    async getStorageInfo() {
        try {
            const data = await si.fsSize();
            
            if (Array.isArray(data) && data.length > 0) {
                const targetMount = this.config.mount || null;
                let partition = null;

                if (targetMount) {
                    partition = data.find(p => p.mount && p.mount.toLowerCase() === targetMount.toLowerCase());
                }

                // fallback for linux root '/'
                if (!partition) {
                    partition = data.find(p => p.mount === '/');
                }

                // fallback for windows primary drive 'C:'
                if (!partition) {
                    partition = data.find(p => p.mount && p.mount.toUpperCase().startsWith('C:'));
                }

                // fallback for first partition with non-zero size
                if (!partition) {
                    partition = data.find(p => p.size > 0);
                }

                if (partition) {
                    this.status['STORAGE'].total = this.convert(partition.size, 2);
                    this.status['STORAGE'].used = this.convert(partition.used, 2);
                    this.status['STORAGE'].percent = typeof partition.use === 'number' ? partition.use : (partition.size > 0 ? Math.round((partition.used / partition.size) * 100) : 0);
                }
            }
        } catch (error) {
            Log.error(`Error while getting storage info: ${error}`);
        }
    },

    async getCPUType() {
        try {
            const data = await si.cpu();
            this.status['CPU'].type = data.brand || data.manufacturer || 'unknown';
        } catch (error) {
            Log.error(`Error while getting CPU type: ${error}`);
        }
    },

    async getCPUInfo() {
        try {
            const load = await si.currentLoad();

            if (load && typeof load.currentLoad === 'number') {
                this.status['CPU'].usage = load.currentLoad.toFixed(0);
            }
        } catch (error) {
            Log.error(`Error while getting CPU usage: ${error}`);
        }

        try {
            const data = await si.cpuTemperature();

            if (data && data.main !== null && data.main !== undefined && !isNaN(data.main) && data.main >= 0) {
                this.status['CPU'].temp = Number(data.main).toFixed(1);
            } else {
                this.status['CPU'].temp = 0;
            }
        } catch (error) {
            Log.error(`Error while getting CPU temperature: ${error}`);
            this.status['CPU'].temp = 0;
        }
    },

    convert(octet, FixTo = 2) {
        if (octet === null || octet === undefined || isNaN(octet)) return '0B';
        
        octet = Math.abs(parseInt(octet, 10));

        if (octet === 0) return '0B';

        const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
        let unitIndex = 0;
        let value = octet;

        while (value >= 1024 && unitIndex < units.length - 1) {
            value /= 1024;
            unitIndex++;
        }

        return (unitIndex === 0 ? value : value.toFixed(FixTo)) + units[unitIndex];
    },

    convertTime(seconds) {
        if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) return '0 seconds';
        
        let humanTime;
        
        if (seconds > 60*60*24) {
            humanTime = Math.round(seconds/(60*60*24)) + ' days';
        } else if (seconds > 60*60) {
            humanTime = Math.round(seconds/(60*60)) + ' hours';
        } else if (seconds > 60) {
            humanTime = Math.round(seconds/60) + ' minutes';
        } else {
            humanTime = Math.round(seconds) + ' seconds';
        }

        return humanTime;
    },

    async getPiThrottle() {
        if (process.platform !== 'linux') {
            return;
        }

        try {
            await new Promise((resolve) => {
                exec('vcgencmd get_throttled', { timeout: 1500 }, (error, stdout) => {
                    if (error || !stdout) {
                        return resolve();
                    }

                    const match = stdout.trim().match(/throttled=(0x[0-9a-fA-F]+)/);

                    if (match) {
                        const code = parseInt(match[1], 16);
                        this.status['DEVICE'].throttled = {
                            code,
                            underVoltage: Boolean(code & 0x1),
                            armFrequencyCapped: Boolean(code & 0x2),
                            currentlyThrottled: Boolean(code & 0x4),
                            softTempLimit: Boolean(code & 0x8),
                            hasUnderVoltage: Boolean(code & 0x10000),
                            hasArmFrequencyCapped: Boolean(code & 0x20000),
                            hasThrottled: Boolean(code & 0x40000),
                            hasSoftTempLimit: Boolean(code & 0x80000)
                        };
                    }

                    resolve();
                });
            });
        } catch (error) {
            // Fail silently on non-Pi Linux environments
        }
    },

});
