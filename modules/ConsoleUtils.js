/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define */

define(function (require, exports, module) {
    "use strict";

    var _consoleMethods = {};

    /**
     * Disable some console methods
     * @param {Array.<String>|String} A list of methods to disable
     */
    exports.disable = function (methods) {
        methods = Array.isArray(methods) ? methods : methods ? [methods] : ["error", "info", "log", "warn"];
        methods.forEach(function (method) {
            if (window.console[method] && !_consoleMethods[method]) {
                _consoleMethods[method] = window.console[method];
                window.console[method] = function () {};
            }
        });
    };

    /**
     * Enable disabled console methods
     * @param {Array.<String>|String} A list of methods to enable
     */
    exports.enable = function (methods) {
        methods = Array.isArray(methods) ? methods : methods ? [methods] : Object.keys(_consoleMethods);
        methods.forEach(function (method) {
            if (_consoleMethods[method]) {
                window.console[method] = _consoleMethods[method];
                delete _consoleMethods[method];
            }
        });
    };
});