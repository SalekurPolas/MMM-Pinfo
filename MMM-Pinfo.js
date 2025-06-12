'use strict';

Module.register('MMM-Pinfo', {
    defaults: {
        debug: false,
        refresh: 5000,
        itemAlign: 'left',
        labelAlign: 'left',
        valueAlign: 'center',
        labelSize: null,
        containerSize: null,
        header: 'Mirror Information',

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
                STORAGE_USED: 80
            }
        },
    },

    start: function() {
        this.item = 0;
        this.container = 0;
        
        this.status = {
            DEVICE: {
                model: 'Loading...',
                serial: 'Loading...'
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
        }

        this.config = this.merge({}, this.defaults, this.config);

        if(this.data.position === 'top_left' || this.data.position === 'bottom_left') {
            this.config.itemAlign = 'flex-start';
        } else if(this.data.position === 'top_right' || this.data.position === 'bottom_right') {
            this.config.itemAlign = 'flex-end';
        } else {
            this.config.header = null;
            this.config.itemAlign = 'center';
        }

        this.sendSocketNotification('CONFIG', this.config);
    },

    suspend: function() {
        this.hidden = true;
        Log.log("[ " + this.name + " ] " + " is suspended.");
    },

    resume: function() {
        this.hidden = false;
        Log.log("[ " + this.name + " ] " + " is resumed.");
    },

    getStyles: function () {
        return [this.file('MMM-Pinfo.css')];
    },

    getScripts: function() {
        return    ['moment.js'];
    },

    getHeader: function() {
        if(this.config.header) {
            return this.data.header ? this.data.header : this.config.header;
        } else {
            return null;
        }
    },

    getDom: function() {
        var wrapper = document.createElement("div");
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
    
    getDomDeviceModel: function() {
        var wrapper = document.createElement("div");
        wrapper.className = "item";
        wrapper.style.order = this.config.DEVICE.orderModel;
        wrapper.style.justifyContent = this.config.itemAlign;

        var label = document.createElement("div");
        label.className = "label";
        label.style.width = this.labelSize + "px";
        label.style.textAlign = this.config.labelAlign;
        label.innerHTML = this.config.DEVICE.labelModel;

        var container = document.createElement("div");
        container.className = "container";
        container.style.width = this.containerSize + "px";

        var value = document.createElement("div");
        value.className = "value";
        value.innerHTML = this.status['DEVICE'].model;
        value.style.textAlign = this.config.valueAlign;

        if (this.config.DEVICE.labelModel.length > this.item) this.item = this.config.DEVICE.labelModel.length;
        if (this.status['DEVICE'].model.length > this.container) this.container = this.status['DEVICE'].model.length;

        container.appendChild(value);
        wrapper.appendChild(label);
        wrapper.appendChild(container);
        return wrapper;
    },

    getDomDeviceSerial: function() {
        var wrapper = document.createElement("div");
        wrapper.className = "item";
        wrapper.style.justifyContent = this.config.itemAlign;
        wrapper.style.order = this.config.DEVICE.orderSerial;

        var label = document.createElement("div");
        label.className = "label";
        label.style.width = this.labelSize + "px";
        label.style.textAlign = this.config.labelAlign;
        label.innerHTML = this.config.DEVICE.labelSerial;
        
        var container = document.createElement("div");
        container.className = "container";
        container.style.width = this.containerSize + "px";

        var value = document.createElement("div");
        value.className = "value";
        value.innerHTML = this.status['DEVICE'].serial;
        value.style.textAlign = this.config.valueAlign;

        if (this.config.DEVICE.labelSerial.length > this.item) this.item = this.config.DEVICE.labelSerial.length;
        if (this.status['DEVICE'].serial.length > this.container) this.container = this.status['DEVICE'].serial.length;

        container.appendChild(value);
        wrapper.appendChild(label);
        wrapper.appendChild(container);
        return wrapper;
    },

    getDomOS: function() {
        var wrapper = document.createElement("div");
        wrapper.className = "item";
        wrapper.style.justifyContent = this.config.itemAlign;
        wrapper.style.order = this.config.OS.orderOs;

        var label = document.createElement("div");
        label.className = "label";
        label.style.width = this.labelSize + "px";
        label.style.textAlign = this.config.labelAlign;
        label.innerHTML = this.config.OS.labelOs;
        
        var container = document.createElement("div");
        container.className = "container";
        container.style.width = this.containerSize + "px";

        var value = document.createElement("div");
        value.className = "value";
        value.innerHTML = this.status['OS'];
        value.style.textAlign = this.config.valueAlign;

        if (this.config.OS.labelOs.length > this.item) this.item = this.config.OS.labelOs.length;
        if (this.status['OS'].length > this.container) this.container = this.status['OS'].length;

        container.appendChild(value);
        wrapper.appendChild(label);
        wrapper.appendChild(container);
        return wrapper;
    },

    getDomNetworkType: function() {
        var wrapper = document.createElement("div");
        wrapper.className = "item";
        wrapper.style.justifyContent = this.config.itemAlign;
        wrapper.style.order = this.config.NETWORK.orderType;

        var label = document.createElement("div");
        label.className = "label";
        label.style.width = this.labelSize + "px";
        label.style.textAlign = this.config.labelAlign;
        label.innerHTML = this.config.NETWORK.labelType;
        
        var container = document.createElement("div");
        container.className = "container";
        container.style.width = this.containerSize + "px";

        var value = document.createElement("div");
        value.className = "value";
        value.innerHTML = this.status['NETWORK'].type;
        value.style.textAlign = this.config.valueAlign;

        if (this.config.NETWORK.labelType.length > this.item) this.item = this.config.NETWORK.labelType.length;
        if (this.status['NETWORK'].type.length > this.container) this.container = this.status['NETWORK'].type.length;

        container.appendChild(value);
        wrapper.appendChild(label);
        wrapper.appendChild(container);
        return wrapper;
    },

    getDomNetworkIPv4: function() {
        var wrapper = document.createElement("div");
        wrapper.className = "item";
        wrapper.style.justifyContent = this.config.itemAlign;
        wrapper.style.order = this.config.NETWORK.orderIPv4;

        var label = document.createElement("div");
        label.className = "label";
        label.style.width = this.labelSize + "px";
        label.style.textAlign = this.config.labelAlign;
        label.innerHTML = this.config.NETWORK.labelIPv4;
        
        var container = document.createElement("div");
        container.className = "container";
        container.style.width = this.containerSize + "px";

        var value = document.createElement("div");
        value.className = "value";
        value.innerHTML = this.status['NETWORK'].ipv4;
        value.style.textAlign = this.config.valueAlign;

        if (this.config.NETWORK.labelIPv4.length > this.item) this.item = this.config.NETWORK.labelIPv4.length;
        if (this.status['NETWORK'].ipv4.length > this.container) this.container = this.status['NETWORK'].ipv4.length;

        container.appendChild(value);
        wrapper.appendChild(label);
        wrapper.appendChild(container);
        return wrapper;
    },

    getDomNetworkIPv6: function() {
        var wrapper = document.createElement("div");
        wrapper.className = "item";
        wrapper.style.justifyContent = this.config.itemAlign;
        wrapper.style.order = this.config.NETWORK.orderIPv6;

        var label = document.createElement("div");
        label.className = "label";
        label.style.width = this.labelSize + "px";
        label.style.textAlign = this.config.labelAlign;
        label.innerHTML = this.config.NETWORK.labelIPv6;
        
        var container = document.createElement("div");
        container.className = "container";
        container.style.width = this.containerSize + "px";

        var value = document.createElement("div");
        value.className = "value";
        value.innerHTML = this.status['NETWORK'].ipv6;
        value.style.textAlign = this.config.valueAlign;

        if (this.config.NETWORK.labelIPv6.length > this.item) this.item = this.config.NETWORK.labelIPv6.length;
        if (this.status['NETWORK'].ipv6.length > this.container) this.container = this.status['NETWORK'].ipv6.length;

        container.appendChild(value);
        wrapper.appendChild(label);
        wrapper.appendChild(container);
        return wrapper;
    },

    getDomNetworkMac: function() {
        var wrapper = document.createElement("div");
        wrapper.className = "item";
        wrapper.style.justifyContent = this.config.itemAlign;
        wrapper.style.order = this.config.NETWORK.orderMac;

        var label = document.createElement("div");
        label.className = "label";
        label.style.width = this.labelSize + "px";
        label.style.textAlign = this.config.labelAlign;
        label.innerHTML = this.config.NETWORK.labelMac;
        
        var container = document.createElement("div");
        container.className = "container";
        container.style.width = this.containerSize + "px";

        var value = document.createElement("div");
        value.className = "value";
        value.innerHTML = this.status['NETWORK'].mac;
        value.style.textAlign = this.config.valueAlign;

        if (this.config.NETWORK.labelMac.length > this.item) this.item = this.config.NETWORK.labelMac.length;
        if (this.status['NETWORK'].mac.length > this.container) this.container = this.status['NETWORK'].mac.length;

        container.appendChild(value);
        wrapper.appendChild(label);
        wrapper.appendChild(container);
        return wrapper;
    },

    getDomCPUType: function() {
        var wrapper = document.createElement("div");
        wrapper.className = "item";
        wrapper.style.justifyContent = this.config.itemAlign;
        wrapper.style.order = this.config.CPU.orderType;

        var label = document.createElement("div");
        label.className = "label";
        label.style.width = this.labelSize + "px";
        label.style.textAlign = this.config.labelAlign;
        label.innerHTML = this.config.CPU.labelType;
        
        var container = document.createElement("div");
        container.className = "container";
        container.style.width = this.containerSize + "px";

        var value = document.createElement("div");
        value.className = "value";
        value.innerHTML = this.status['CPU'].type;
        value.style.textAlign = this.config.valueAlign;

        if (this.config.CPU.labelType.length > this.item) this.item = this.config.CPU.labelType.length;
        if (this.status['CPU'].type.length > this.container) this.container = this.status['CPU'].type.length;

        container.appendChild(value);
        wrapper.appendChild(label);
        wrapper.appendChild(container);
        return wrapper;
    },

    getDomUptime : function() {
      var wrapper = document.createElement("div");
      wrapper.className = "item";
      wrapper.style.justifyContent = this.config.itemAlign;
      wrapper.style.order = this.config.UPTIME.orderUptime;
      
      var label = document.createElement("div");
      label.className = "label";
      label.style.width = this.labelSize + "px";
      label.style.textAlign = this.config.labelAlign;
      label.innerHTML = this.config.UPTIME.labelUptime;
        
        var container = document.createElement("div");
        container.className = "container";
        container.style.width = this.containerSize + "px";

        var value = document.createElement("div");
        value.className = "value";
        value.innerHTML = this.status['UPTIME'];
        value.style.textAlign = this.config.valueAlign;

        if (this.config.UPTIME.labelUptime.length > this.item) this.item = this.config.UPTIME.labelUptime.length;
        if (this.status['UPTIME'].length > this.container) this.container = this.status['UPTIME'].length;

        container.appendChild(value);
        wrapper.appendChild(label);
        wrapper.appendChild(container);
      return wrapper;
    },

    getDomCPUTemp : function() {
        var wrapper = document.createElement("div");
        wrapper.className = "item";
        wrapper.style.justifyContent = this.config.itemAlign;
        wrapper.style.order = this.config.CPU.orderTemp;
        
        var label = document.createElement("div");
        label.className = "label";
        label.style.width = this.labelSize + "px";
        label.style.textAlign = this.config.labelAlign;
        label.innerHTML = this.config.CPU.labelTemp;

        var container = document.createElement("div");
        container.className = "container";
        container.style.width = this.containerSize + "px";

        var total = document.createElement("div");
        total.className = "total";
        if (config.units === 'imperial') {
          total.innerHTML = Math.round(this.status['CPU'].temp * 9/5 + 32, 0) + '\°F';
        }
        else {
          total.innerHTML = this.status['CPU'].temp + '\°C';
        }

        var used = document.createElement("div");
        used.style.opacity = 0.75;
        used.style.width = this.status['CPU'].temp + "%";

        var step = this.getLevel(this.status['CPU'].temp, -1);
        step > 100 ? step = 100 : step = step;
        used.className = "bar step" + step;

        if (this.config.CPU.labelTemp.length > this.item) this.item = this.config.CPU.labelTemp.length;

        total.appendChild(used);
        container.appendChild(total);
        wrapper.appendChild(label);
        wrapper.appendChild(container);
        return wrapper;
    },

    getDomCPUUsage : function() {
        var wrapper = document.createElement("div");
        wrapper.className = "item";
        wrapper.style.justifyContent = this.config.itemAlign;
        wrapper.style.order = this.config.CPU.orderUsage;

        var label = document.createElement("div");
        label.className = "label";
        label.style.width = this.labelSize + "px";
        label.style.textAlign = this.config.labelAlign;
        label.innerHTML = this.config.CPU.labelUsage;

        var container = document.createElement("div");
        container.className = "container";
        container.style.width = this.containerSize + "px";

        var total = document.createElement("div");
        total.className = "total";
        total.innerHTML = " &nbsp;";

        var used = document.createElement("div");
        used.style.opacity = 0.75;
        used.innerHTML = this.status["CPU"].usage + "%";
        used.style.width = Math.round(this.status['CPU'].usage) + "%";

        var step = this.getLevel(this.status["CPU"].usage, -1);
        step > 100 ? step = 100 : step = step;
        used.className = "bar step" + step;

        if (this.config.CPU.labelUsage.length > this.item ) this.item = this.config.CPU.labelUsage.length;

        total.appendChild(used);
        container.appendChild(total);
        wrapper.appendChild(label);
        wrapper.appendChild(container);
        return wrapper
    },

    getDomMemory : function () {
        var wrapper = document.createElement("div");
        wrapper.className = "item";
        wrapper.style.justifyContent = this.config.itemAlign;
        wrapper.style.order = this.config.RAM.orderRam;

        var label = document.createElement("div");
        label.className = "label";
        label.style.width = this.labelSize + "px";
        label.style.textAlign = this.config.labelAlign;
        label.innerHTML = this.config.RAM.labelRam;

        var container = document.createElement("div");
        container.className = "container";
        container.style.width = this.containerSize + "px";

        var total = document.createElement("div");
        total.className = "total";
        total.innerHTML = this.status["MEMORY"].total;

        var used = document.createElement("div");
        used.style.width = Math.round(this.status["MEMORY"].percent) + "%";
        used.innerHTML = this.status["MEMORY"].used;

        var step = this.getLevel(this.status["MEMORY"].percent, -1);
        step > 100 ? step = 100 : step = step;
        used.className = "bar step" + step;
        used.style.opacity = 0.75;

        if (this.config.RAM.labelRam.length > this.item ) this.item = this.config.RAM.labelRam.length;

        total.appendChild(used)
        container.appendChild(total)
        wrapper.appendChild(label)
        wrapper.appendChild(container)
        return wrapper;
    },

    getDomStorage : function () {
        var wrapper = document.createElement("div");
        wrapper.className = "item";
        wrapper.style.justifyContent = this.config.itemAlign;
        wrapper.style.order = this.config.STORAGE.orderStorage;

        var label = document.createElement("div");
        label.className = "label";
        label.style.width = this.labelSize + "px";
        label.style.textAlign = this.config.labelAlign;
        label.innerHTML = this.config.STORAGE.labelStorage;

        var container = document.createElement("div");
        container.className = "container";
        container.style.width = this.containerSize + "px";

        var total = document.createElement("div");
        total.className = "total";
        total.innerHTML = this.status["STORAGE"].total;

        var used = document.createElement("div");
        used.style.width = Math.round(this.status["STORAGE"].percent) + "%";
        used.innerHTML = this.status["STORAGE"].used;

        var step = this.getLevel(this.status["STORAGE"].percent, -1);
        step > 100 ? step = 100 : step = step;
        used.className = "bar step" + step;
        used.style.opacity = 0.75;

        if (this.config.STORAGE.labelStorage.length > this.item ) this.item = this.config.STORAGE.labelStorage.length;

        total.appendChild(used)
        container.appendChild(total)
        wrapper.appendChild(label)
        wrapper.appendChild(container)
        return wrapper;
    },

    checkWarning : function() {
        if(this.config.WARNING.enable) {
            for(var name in this.config.WARNING.check) {
                var checkValue = this.config.WARNING.check[name];
                if(name == "CPU_TEMP") {
                    let actualValue = parseFloat(this.status["CPU"].temp);
                    if(checkValue < actualValue) this.showWarning(name, actualValue, checkValue);
                } else if(name == "CPU_USAGE") {
                    let actualValue = parseFloat(this.status["CPU"].usage);
                    if(checkValue < actualValue) this.showWarning(name, actualValue, checkValue);
                } else if(name == "MEMORY_USED") {
                    let actualValue = parseFloat(this.status["MEMORY"].percent);
                    if(checkValue < actualValue) this.showWarning(name, actualValue, checkValue);
                } else if(name == "STORAGE_USED") {
                    let actualValue = parseFloat(this.status["STORAGE"].percent);
                    if(checkValue < actualValue) this.showWarning(name, actualValue, checkValue);
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
        var factor = Math.pow(10, precision);
        var tempNumber = Math.round(number * factor);
        return tempNumber / factor;
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

    merge: function(e) {
        for (var o, t, r = Array.prototype.slice.call(arguments, 1); r.length;) {
            o = r.shift();
            for (t in o) o.hasOwnProperty(t) && ("object" == typeof e[t] && e[t] && "[object Array]" !== Object.prototype.toString.call(e[t]) && "object" == typeof o[t] && null !== o[t] ? e[t] = configMerge({}, e[t], o[t]) : e[t] = o[t]);
        }
        return e;
    }
});