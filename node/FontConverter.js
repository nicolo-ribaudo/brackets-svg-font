/*jslint node: true */

"use strict";

// -- CONSTANTS
var DOMAIN = "fontConverter",
    // -- MODULES
    fs = require("fs"),
    ttf2svg = require("ttf2svg");

function convert(path, callback) {
    fs.readFile(path, function (error, buffer) {
        if (error) {
            callback(error);
        } else {
            var svg = ttf2svg(buffer);
            callback(null, svg);
        }
    });
}

exports.init = function (domainManager) {
    if (!domainManager.hasDomain(DOMAIN)) {
        domainManager.registerDomain(DOMAIN);
    }
    domainManager.registerCommand(
        DOMAIN,
        "convert",
        convert,
        true, // Async
        "Converts the given binary font into an svg font.",
        [
            {
                name: "path",
                type: "string",
                description: "The path of the font to convert."
            }
        ]
    );
};
