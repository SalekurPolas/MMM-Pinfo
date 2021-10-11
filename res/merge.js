"use strict";
var merge = function(e) {
    for (var o, t, r = Array.prototype.slice.call(arguments, 1); r.length;)
        for (t in o = r.shift()) o.hasOwnProperty(t) && ("object" == typeof e[t] && e[t] && "[object Array]" !== Object.prototype.toString.call(e[t]) && "object" == typeof o[t] && null !== o[t] ? e[t] = configMerge({}, e[t], o[t]) : e[t] = o[t]);
    return e
};