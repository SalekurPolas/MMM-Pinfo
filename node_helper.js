'use strict';

const si = require('systeminformation');
const NodeHelper = require('node_helper');
const Log = require('logger');

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
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === "CONFIG") {
            this.config = payload;
            this.collectStaticInfo();
        }
    },

    collectStaticInfo: async function() {
        await this.getDeviceInfo();
        await this.getOSInfo();
        await this.getCPUType();
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

    getDeviceInfo: async function() {
        await si.system().then(data => {
            this.status['DEVICE'].model = data.model;
            this.status['DEVICE'].serial = data.serial;
        }).catch(error => {
            Log.error(`Error while getting device info: ${error}`);
        });
    },

    getOSInfo: async function() {
        await si.osInfo().then(data => {
            this.status['OS'] = data.distro.split(' ')[0] + " " + data.release + " (" + data.codename + ")";
        }).catch(error => {
            Log.error(`Error while getting OS info: ${error}`);
        });
    },

    getNetworkInfo: async function() {
        await si.networkInterfaceDefault().then(async defaultInt => {
            await si.networkInterfaces().then(data => {
                data.forEach(net => {
                    if((net.iface != "lo") && (net.iface === defaultInt)) {
                        this.status['NETWORK'].type = net.iface;
                        this.status['NETWORK'].ipv4 = net.ip4;
                        this.status['NETWORK'].ipv6 = net.ip6;
                        this.status['NETWORK'].mac = net.mac;
                    }
                });
            }).catch(error => {
                Log.error(`Error while getting network interfaces: ${error}`);
            });
        }).catch(error => {
            Log.error(`Error while getting default network interface: ${error}`);
        });
    },

    getMemoryInfo: async function() {
        await si.mem().then(data => {
            this.status['MEMORY'].total = this.convert(data.total, 0);
            this.status['MEMORY'].used = this.convert(data.used-data.buffcache, 2);
            this.status['MEMORY'].percent = ((data.used-data.buffcache) / data.total * 100).toFixed(0);
        }).catch(error => {
            Log.error(`Error while getting memory info: ${error}`);
        });
    },

    getStorageInfo: async function() {
        await si.fsSize().then(data => {
            data.forEach(partition => {
                if(partition.mount === '/') {
                    this.status['STORAGE'].total = this.convert(partition.size, 2);
                    this.status['STORAGE'].used = this.convert(partition.used, 2);
                    this.status['STORAGE'].percent = partition.use;
                }
            })
        }).catch(error => {
            Log.error(`Error while getting storage info: ${error}`);
        });
    },

    getCPUType: async function() {
        await si.cpu().then(data => {
            this.status['CPU'].type = data.brand;
        }).catch(error => {
            Log.error(`Error while getting CPU type: ${error}`);
        });
    },

    getCPUInfo: async function() {
        await si.currentLoad().then(data => {
            this.status['CPU'].usage = data.currentLoad.toFixed(0);
        }).catch(error => {
            Log.error(`Error while getting CPU usage: ${error}`);
        });

        await si.cpuTemperature().then(data => {
            this.status['CPU'].temp = data.main.toFixed(1);
        }).catch(error => {
            Log.error(`Error while getting CPU temperature: ${error}`);
        });
    },

    convert: function(octet, FixTo) {
        octet = Math.abs(parseInt(octet, 10));
        let def = [
            [1, 'B'],
            [1024, 'KB'],
            [1024*1024, 'MB'],
            [1024*1024*1024, 'GB'],
            [1024*1024*1024*1024, 'TB']];

        for(let i = 0; i < def.length; i++){
            if(octet < def[i][0]) return (octet / def[i-1][0]).toFixed(FixTo) + def[i - 1][1];
        }
    },

    convertTime: function(seconds) {
	  let humanTime;
      if (seconds > 60*60*24) {
        humanTime = Math.round(seconds/(60*60*24), 0) + ' days'
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
