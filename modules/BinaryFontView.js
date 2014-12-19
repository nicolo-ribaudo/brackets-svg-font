/*jslint regexp: true */
/*global $, brackets, define */

define(function (require, exports, module) {
    "use strict";

    // -- CONSTANTS
    var NODE_DOMAIN = "fontConverter",
        // -- MODULES
        ExtensionUtils = brackets.getModule("utils/ExtensionUtils"),
        NodeDomain = brackets.getModule("utils/NodeDomain"),
        FontView = require("modules/FontView"),
        SvgFontView = require("modules/SvgFontView"),
        // -- VARIABLES
        FontConverter = new NodeDomain(NODE_DOMAIN, ExtensionUtils.getModulePath(module, "../node/FontConverter.js"));

    function BinaryFontView(file, $container) {
        this._fontType = this._extensions[file.fullPath.match(/[a-z]+$/i)[0]];
        this.parentClass.constructor.apply(this, arguments);
    }

    BinaryFontView.prototype = Object.create(SvgFontView.prototype, {
        constructor: {
            value: BinaryFontView,
            configurable: true,
            enumerable: false,
            writable: true
        },
        parentClass: {
            value: FontView.prototype,
            configurable: true,
            enumerable: false,
            writable: true
        }
    });

    BinaryFontView.prototype._extensions = {
        ttf: "TrueType"
    };

    BinaryFontView.prototype._loadFont = function () {
        var deferred = $.Deferred();
        FontConverter.exec("convert", this._file.fullPath).then(function (svg) {
            var parsedContent = $.parseXML(svg.replace(/\n\r|\n|\r/g, "").match(/<svg.*?<\/svg>/i)[0]);
            this._$font = $(parsedContent).find("font");
            this._fileContent = svg;
            deferred.resolve();
        }.bind(this), function (error) {
            deferred.reject(error);
        });
        return deferred.promise();
    };

    BinaryFontView.prototype._parseFont = function () {
        // When a font parser will be used (instead of a converter), BinaryFontView won't depend on SvgFontView
        SvgFontView.prototype._parseFont.call(this);

        // Why are some glyphs added?
        this._glyphs = this._glyphs.filter(function (glyph, i) {
            var joined = glyph.unicode.join();
            return this._glyphs.every(function (glyph, x) {
                return x >= i || glyph.unicode.join() !== joined;
            });
        }.bind(this));
    };

    module.exports = BinaryFontView;

});
