'use strict';

const fs = require('fs');
const os = require('os');
const si = require('systeminformation');
const NodeHelper = require('node_helper');
var log = (...args) => {}

module.exports = NodeHelper.create({
    start: function() {
        this.config = {};
        this.timer = null;

        this.status = {
          DEVICE: {
            model: 'unknown',
            serial: 'unknown'
          },
          OS: 'unknown',
          NETWORK: {
            type: 'unknown',
            ipv4: 'unknown',
            ipv6: 'unknown',
            mac: 'unknown'
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
        }

        this.network = os.networkInterfaces();
        this.DeviceInfo = fs.readFileSync('/proc/cpuinfo', 'utf8').split("\n");
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === "CONFIG") {
            this.config = payload;
            if(this.config.debug) {
                log = (...args) => {
                    console.log("[" + this.name + "]", ...args);
                }
            }

            this.collectStaticInfo();
        }
    },

    collectStaticInfo: async function() {
        await this.getDeviceInfo();
        await this.getOSInfo();
        this.scheduler();
    },

    scheduler: async function() {
        clearTimeout(this.timer);

        await this.collectDynamicInfo(resolve => {
            this.sendSocketNotification('STATUS', this.status);
        });

        this.timer = setTimeout(() => {
            this.scheduler();
        }, this.config.refresh);
    },

    collectDynamicInfo: async function(resolve) {
        await this.getNetworkInfo();
        await this.getMemoryInfo();
        await this.getStorageInfo();
        await this.getCPUInfo();
        await this.getUptime();
        resolve();
    },

    getUptime: function() {
      this.status['UPTIME'] = this.convertTime(si.time().uptime)
    },

    getDeviceInfo: function() {
        return new Promise((resolve) => {
            var ModelInfo = this.DeviceInfo[this.DeviceInfo.length - 2].split(":");
            if (!ModelInfo[1]) {
                resolve();
                return;
            }
            var model = ModelInfo[1].slice(1).split(' ');
            delete model[model.length-1];
            delete model[model.length-2];
            this.status['DEVICE'].model = model.toString().replace(new RegExp(',', 'g'), ' ');

            var SerialInfo = this.DeviceInfo[this.DeviceInfo.length - 3].split(":");
            this.status['DEVICE'].serial = SerialInfo[1].slice(1);
            resolve();
        })
    },

    getOSInfo: function() {
        return new Promise((resolve) => {
            si.osInfo().then(data => {
                this.status['OS'] = data.distro.split(' ')[0] + " " + data.release + " (" + data.codename + ")";
                resolve();
            }).catch(error => {
                log(error);
            });
        })
    },

    getNetworkInfo: function() {
        return new Promise((resolve) => {
            si.networkInterfaceDefault().then(defaultInt => {
                si.networkInterfaces().then(data => {
                    data.forEach(net => {
                        if((net.iface != "lo") && (net.iface === defaultInt)) {
                            this.status['NETWORK'].type = net.iface;
                            this.status['NETWORK'].ipv4 = net.ip4;
                            this.status['NETWORK'].ipv6 = net.ip6;
                            this.status['NETWORK'].mac = net.mac;
                        } resolve();
                    });
                }).catch(error => {
                    log(error);
                });
            }).catch(error => {
                log(error);
            });
        })
    },

    getMemoryInfo: function() {
        return new Promise((resolve) => {
            si.mem().then(data => {
                this.status['MEMORY'].total = this.convert(data.total, 0);
                this.status['MEMORY'].used = this.convert(data.used-data.buffcache, 2);
                this.status['MEMORY'].percent = ((data.used-data.buffcache) / data.total * 100).toFixed(0);
                resolve();
            }).catch(error => {
                log(error);
            });
        });
    },

    getStorageInfo: function() {
        return new Promise((resolve) => {
            si.fsSize().then(data => {
                data.forEach(partition => {
                    if(partition.mount === '/') {
                        this.status['STORAGE'].total = this.convert(partition.size, 2);
                        this.status['STORAGE'].used = this.convert(partition.used, 2);
                        this.status['STORAGE'].percent = partition.use;
                        resolve();
                    }
                })
            }).catch(error => {
                log(error);
            });
        });
    },

    getCPUInfo: function() {
        return new Promise((resolve) => {
            var CPUInfo = this.DeviceInfo[this.DeviceInfo.length - 14].split(":");
        try {
                var type = CPUInfo[1].slice(1).split(' ');
                delete type[type.length-1];
                delete type[type.length-2];
                delete type[type.length-3];
                this.status['CPU'].type = type.toString().replace(new RegExp(',', 'g'), ' ');
        }
        catch {
            this.status['CPU'].type = 'Not available'
        }

            si.currentLoad().then(data => {
                this.status['CPU'].usage = data.currentLoad.toFixed(0);
            }).catch(error => {
                log(error);
            });

            si.cpuTemperature().then(data => {
                this.status['CPU'].temp = data.main.toFixed(1);
            }).catch(error => {
                log(error);
            });
            resolve();
        })
    },

    convert: function(octet, FixTo) {
        octet = Math.abs(parseInt(octet, 10));
        var def = [
            [1, 'B'],
            [1024, 'KB'],
            [1024*1024, 'MB'],
            [1024*1024*1024, 'GB'],
            [1024*1024*1024*1024, 'TB']];

        for(var i = 0; i < def.length; i++){
            if(octet < def[i][0]) return (octet / def[i-1][0]).toFixed(FixTo) + def[i - 1][1];
        }
    },

    convertTime: function(seconds) {
      if (seconds > 60*60*24) {
        var humanTime = Math.round(seconds/(60*60*24), 0) + ' days'
      }
      else if (seconds > 60*60) {
        humanTime = Math.round(seconds/(60*60), 0) + ' hours'
      }
      else if (seconds > 60) {
        humanTime = Math.round(seconds/60, 0) + ' minutes'
      }
      else {
        humanTime = Math.round(seconds, 0) + ' seconds'
      }
      return humanTime
    },

});
