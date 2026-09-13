'use strict';

Module.register('MMM-Pinfo', {
    defaults: {
        refresh: 5000,
        itemAlign: 'left',
        labelAlign: 'left',
        valueAlign: 'center',
        labelSize: null,
        containerSize: null,
        header: 'Mirror Information',
        units: null,
        showIcons: false,
        mount: null,
        icons: {
            model: 'fas fa-desktop',
            serial: 'fas fa-fingerprint',
            os: 'fas fa-compact-disc',
            netType: 'fas fa-network-wired',
            ipv4: 'fas fa-globe',
            ipv6: 'fas fa-globe-americas',
            mac: 'fas fa-ethernet',
            ram: 'fas fa-memory',
            storage: 'fas fa-hdd',
            cpuType: 'fas fa-microchip',
            cpuUsage: 'fas fa-tachometer-alt',
            cpuTemp: 'fas fa-thermometer-half',
            uptime: 'fas fa-clock'
        },

        DEVICE: {
            labelModel: "Model",
            displayModel: true,
            orderModel: 1,

            labelSerial: 'Serial',
            displaySerial: true,
            orderSerial: 2
        },
        OS: {
            labelOs: 'OS',
            displayOs: false,
            orderOs: 3
        },
        NETWORK: {
            labelType: 'NET Type',
            displayType: false,
            orderType: 4,

            labelIPv4: 'IPv4',
            displayIPv4: true,
            orderIPv4: 5,

            labelIPv6: 'IPv6',
            displayIPv6: false,
            orderIPv6: 6,

            labelMac: 'MAC',
            displayMac: false,
            orderMac: 7
        },
        RAM: {
            labelRam: 'RAM',
            displayRam: true,
            orderRam: 8
        },
        STORAGE: {
            labelStorage: 'Storage',
            displayStorage: true,
            orderStorage: 9,
        },
        CPU: {
            labelType: 'CPU Type',
            displayType: false,
            orderType: 10,

            labelUsage: 'CPU Usage',
            displayUsage: false,
            orderUsage: 11,

            labelTemp: 'CPU Temp',
            displayTemp: true,
            orderTemp: 12
        },
        UPTIME: {
            labelUptime: 'Uptime',
            displayUptime: false,
            orderUptime: 13,
        },
        WARNING: {
            enable: false,
            interval: 1000 * 60 * 5,
            check: {
                CPU_TEMP: 65,
                CPU_USAGE: 75,
                RAM_USED: 80,
                STORAGE_USED: 80,
                UNDER_VOLTAGE: true,
                THROTTLED: true
            }
        },
    },

    start: function() {
        this.item = 0;
        this.container = 0;
        this.lastWarningTimes = {};

        this.status = {
            DEVICE: {
                model: 'Loading...',
                serial: 'Loading...',
                throttled: null
            },
            OS: 'Loading...',
            NETWORK: {
                type: 'Loading...',
                ipv4: 'Loading...',
                ipv6: 'Loading...',
                mac: 'Loading...'
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
                type: 'Loading...',
                usage: 0,
                temp: 0
            },
            UPTIME: 'Loading...',
        };

        this.config = this.merge({}, this.defaults, this.config);

        if (this.data.position === 'top_left' || this.data.position === 'bottom_left') {
            this.config.itemAlign = 'flex-start';
        } else if (this.data.position === 'top_right' || this.data.position === 'bottom_right') {
            this.config.itemAlign = 'flex-end';
        } else {
            this.config.header = null;
            this.config.itemAlign = 'center';
        }

        this.sendSocketNotification('CONFIG', this.config);
    },

    suspend: function() {
        this.hidden = true;
        this.sendSocketNotification('SUSPEND');
        Log.log("[ " + this.name + " ] is suspended.");
    },

    resume: function() {
        this.hidden = false;
        this.sendSocketNotification('RESUME');
        Log.log("[ " + this.name + " ] is resumed.");
    },

    getStyles: function () {
        return [this.file('MMM-Pinfo.css')];
    },

    getHeader: function() {
        if (this.config.header) {
            return this.data.header ? this.data.header : this.config.header;
        } else {
            return null;
        }
    },

    getDom: function() {
        let wrapper = document.createElement("div");
        wrapper.className = "Pinfo";

        if (this.config.DEVICE.displayModel) wrapper.appendChild(this.getDomDeviceModel());
        if (this.config.DEVICE.displaySerial) wrapper.appendChild(this.getDomDeviceSerial());
        if (this.config.OS.displayOs) wrapper.appendChild(this.getDomOS());
        if (this.config.NETWORK.displayType) wrapper.appendChild(this.getDomNetworkType());
        if (this.config.NETWORK.displayIPv4) wrapper.appendChild(this.getDomNetworkIPv4());
        if (this.config.NETWORK.displayIPv6) wrapper.appendChild(this.getDomNetworkIPv6());
        if (this.config.NETWORK.displayMac) wrapper.appendChild(this.getDomNetworkMac());
        if (this.config.RAM.displayRam) wrapper.appendChild(this.getDomMemory());
        if (this.config.STORAGE.displayStorage) wrapper.appendChild(this.getDomStorage());
        if (this.config.CPU.displayType) wrapper.appendChild(this.getDomCPUType());
        if (this.config.CPU.displayUsage) wrapper.appendChild(this.getDomCPUUsage());
        if (this.config.CPU.displayTemp) wrapper.appendChild(this.getDomCPUTemp());
        if (this.config.UPTIME.displayUptime) wrapper.appendChild(this.getDomUptime());
        
        return wrapper;
    },

    createItemElement: function(order, labelText, valueText, iconKey) {
        let wrapper = document.createElement("div");
        wrapper.className = "item";
        wrapper.style.order = order;
        wrapper.style.justifyContent = this.config.itemAlign;

        let label = document.createElement("div");
        label.className = "label";
        label.style.width = this.labelSize + "px";
        label.style.textAlign = this.config.labelAlign;

        if (this.config.showIcons && iconKey && this.config.icons && this.config.icons[iconKey]) {
            let icon = document.createElement("i");
            icon.className = this.config.icons[iconKey] + " item-icon";
            label.appendChild(icon);
        }

        let labelSpan = document.createElement("span");
        labelSpan.textContent = labelText;
        label.appendChild(labelSpan);

        let container = document.createElement("div");
        container.className = "container";
        container.style.width = this.containerSize + "px";

        let value = document.createElement("div");
        value.className = "value";
        value.textContent = valueText;
        value.style.textAlign = this.config.valueAlign;

        if (labelText && labelText.length > this.item) this.item = labelText.length;
        if (valueText && String(valueText).length > this.container) this.container = String(valueText).length;

        container.appendChild(value);
        wrapper.appendChild(label);
        wrapper.appendChild(container);
        
        return wrapper;
    },

    createBarItemElement: function(order, labelText, totalContent, usedContent, percentValue, iconKey) {
        let wrapper = document.createElement("div");
        wrapper.className = "item";
        wrapper.style.order = order;
        wrapper.style.justifyContent = this.config.itemAlign;

        let label = document.createElement("div");
        label.className = "label";
        label.style.width = this.labelSize + "px";
        label.style.textAlign = this.config.labelAlign;

        if (this.config.showIcons && iconKey && this.config.icons && this.config.icons[iconKey]) {
            let icon = document.createElement("i");
            icon.className = this.config.icons[iconKey] + " item-icon";
            label.appendChild(icon);
        }

        let labelSpan = document.createElement("span");
        labelSpan.textContent = labelText;
        label.appendChild(labelSpan);

        let container = document.createElement("div");
        container.className = "container";
        container.style.width = this.containerSize + "px";

        let total = document.createElement("div");
        total.className = "total";
        
        if (typeof totalContent === 'string') {
            total.innerHTML = totalContent;
        } else if (totalContent !== null && totalContent !== undefined) {
            total.textContent = totalContent;
        }

        let used = document.createElement("div");
        used.style.opacity = "0.75";
        
        const clampedPercent = Math.max(0, Math.min(100, Math.round(percentValue || 0)));
        used.style.width = clampedPercent + "%";
        
        if (usedContent) {
            used.innerHTML = usedContent;
        }

        let step = this.getLevel(percentValue, -1);
        used.className = "bar step" + step;

        if (labelText && labelText.length > this.item) this.item = labelText.length;

        total.appendChild(used);
        container.appendChild(total);
        wrapper.appendChild(label);
        wrapper.appendChild(container);
        
        return wrapper;
    },

    getDomDeviceModel: function() {
        const item = this.createItemElement(
            this.config.DEVICE.orderModel,
            this.config.DEVICE.labelModel,
            this.status.DEVICE.model,
            'model'
        );

        if (this.status.DEVICE && this.status.DEVICE.throttled) {
            const thr = this.status.DEVICE.throttled;
            const valueEl = item.querySelector('.value');
            if (valueEl) {
                if (thr.underVoltage) {
                    const bolt = document.createElement('i');
                    bolt.className = 'fas fa-bolt warning-indicator danger';
                    bolt.title = 'Under-voltage detected!';
                    valueEl.appendChild(bolt);
                } else if (thr.currentlyThrottled) {
                    const flame = document.createElement('i');
                    flame.className = 'fas fa-fire warning-indicator';
                    flame.title = 'CPU Throttled!';
                    valueEl.appendChild(flame);
                }
            }
        }

        return item;
    },

    getDomDeviceSerial: function() {
        return this.createItemElement(
            this.config.DEVICE.orderSerial,
            this.config.DEVICE.labelSerial,
            this.status.DEVICE.serial,
            'serial'
        );
    },

    getDomOS: function() {
        return this.createItemElement(
            this.config.OS.orderOs,
            this.config.OS.labelOs,
            this.status.OS,
            'os'
        );
    },

    getDomNetworkType: function() {
        return this.createItemElement(
            this.config.NETWORK.orderType,
            this.config.NETWORK.labelType,
            this.status.NETWORK.type,
            'netType'
        );
    },

    getDomNetworkIPv4: function() {
        return this.createItemElement(
            this.config.NETWORK.orderIPv4,
            this.config.NETWORK.labelIPv4,
            this.status.NETWORK.ipv4,
            'ipv4'
        );
    },

    getDomNetworkIPv6: function() {
        return this.createItemElement(
            this.config.NETWORK.orderIPv6,
            this.config.NETWORK.labelIPv6,
            this.status.NETWORK.ipv6,
            'ipv6'
        );
    },

    getDomNetworkMac: function() {
        return this.createItemElement(
            this.config.NETWORK.orderMac,
            this.config.NETWORK.labelMac,
            this.status.NETWORK.mac,
            'mac'
        );
    },

    getDomCPUType: function() {
        return this.createItemElement(
            this.config.CPU.orderType,
            this.config.CPU.labelType,
            this.status.CPU.type,
            'cpuType'
        );
    },

    getDomUptime: function() {
        return this.createItemElement(
            this.config.UPTIME.orderUptime,
            this.config.UPTIME.labelUptime,
            this.status.UPTIME,
            'uptime'
        );
    },

    getDomCPUTemp: function() {
        const rawTemp = parseFloat(this.status.CPU.temp) || 0;
        let units = this.config.units;
        
        if (!units && typeof config !== 'undefined' && config.units) {
            units = config.units;
        }

        let tempText;
        
        if (units === 'imperial') {
            tempText = Math.round(rawTemp * 9/5 + 32) + '°F';
        } else {
            tempText = rawTemp.toFixed(1) + '°C';
        }

        return this.createBarItemElement(
            this.config.CPU.orderTemp,
            this.config.CPU.labelTemp,
            tempText,
            '',
            rawTemp,
            'cpuTemp'
        );
    },

    getDomCPUUsage: function() {
        const usage = parseFloat(this.status.CPU.usage) || 0;
        
        return this.createBarItemElement(
            this.config.CPU.orderUsage,
            this.config.CPU.labelUsage,
            " &nbsp;",
            Math.round(usage) + "%",
            usage,
            'cpuUsage'
        );
    },

    getDomMemory: function() {
        const percent = parseFloat(this.status.MEMORY.percent) || 0;
        
        return this.createBarItemElement(
            this.config.RAM.orderRam,
            this.config.RAM.labelRam,
            this.status.MEMORY.total,
            this.status.MEMORY.used,
            percent,
            'ram'
        );
    },

    getDomStorage: function() {
        const percent = parseFloat(this.status.STORAGE.percent) || 0;

        return this.createBarItemElement(
            this.config.STORAGE.orderStorage,
            this.config.STORAGE.labelStorage,
            this.status.STORAGE.total,
            this.status.STORAGE.used,
            percent,
            'storage'
        );
    },

    checkWarning: function() {
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

        if (this.status.DEVICE && this.status.DEVICE.throttled) {
            const thr = this.status.DEVICE.throttled;
            if (checks.UNDER_VOLTAGE && thr.underVoltage) {
                const lastTime = this.lastWarningTimes['UNDER_VOLTAGE'] || 0;
                if (now - lastTime >= interval) {
                    this.lastWarningTimes['UNDER_VOLTAGE'] = now;
                    this.showWarning("Power Supply", "Low Voltage Detected", "Check power adapter");
                }
            }
            if (checks.THROTTLED && thr.currentlyThrottled) {
                const lastTime = this.lastWarningTimes['THROTTLED'] || 0;
                if (now - lastTime >= interval) {
                    this.lastWarningTimes['THROTTLED'] = now;
                    this.showWarning("CPU Status", "Throttled", "Check cooling / heat sink");
                }
            }
        }
    },

    showWarning: function(name, value, check) {
        this.sendNotification("SHOW_ALERT", {
            type: "notification",
            title: this.name + " WARNING",
            message: name + " value " + value + " exceeds " + check
        });
    },

    getLevel: function(number, precision) {
        if (isNaN(number) || number === null || number === undefined) return 0;
        let factor = Math.pow(10, precision);
        let tempNumber = Math.round(Number(number) * factor);
        let level = tempNumber / factor;
        if (level < 0) return 0;
        if (level > 100) return 100;
        return level;
    },

    notificationReceived: function(notification, payload, sender) {
        if (notification === 'DOM_OBJECTS_CREATED') {
            //.....
        }
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === "STATUS") {
            this.status = payload;
            this.checkWarning();

            this.config.containerSize ? this.containerSize = this.config.containerSize : this.containerSize = (this.container * 7) + 10;
            this.config.labelSize ? this.labelSize = this.config.labelSize : this.labelSize = (this.item * 7) + 10;
            this.updateDom();
        }
    },

    merge: function(target, ...sources) {
        const toString = Object.prototype.toString;

        const isPlainObject = (value) => {
            return toString.call(value) === "[object Object]";
        };

        const cloneValue = (value) => {
            if (Array.isArray(value)) return value.slice();
            if (isPlainObject(value)) return this.merge({}, value);
            return value;
        };

        const output = isPlainObject(target) ? target : {};

        for (const source of sources) {
            if (!isPlainObject(source)) continue;

            for (const [key, sourceValue] of Object.entries(source)) {
                const targetValue = output[key];
                output[key] = isPlainObject(sourceValue) ? this.merge(isPlainObject(targetValue) ? targetValue : {}, sourceValue) : cloneValue(sourceValue);
            }
        }

        return output;
    }
});
