/*jslint regexp: true */
/*global $, brackets, define, Mustache */

define(function (require, exports, module) {
    "use strict";

    // -- MODULES
    var ExtensionUtils = brackets.getModule("utils/ExtensionUtils"),
        WorkspaceManager = brackets.getModule("view/WorkspaceManager"),
        FontView = require("modules/FontView"),
        // -- TEMPLATES
        fontViewerContainerTemplate = require("text!../html/font-view-container.html"),
        fontViewerGlyphsTemplate = require("text!../html/font-view-glyphs.html");

    // Prepare templates for future renders
    Mustache.parse(fontViewerContainerTemplate);
    Mustache.parse(fontViewerGlyphsTemplate);

    // Load StyleSheets
    ExtensionUtils.loadStyleSheet(module, "../styles/main.css");

    /**
     * @constructor
     * @param {File} file - The svg font file to render
     * @param {jQuery} $container - The element to render the svg font view in
     */
    function SvgFontView(file, $container) {
        this.parentClass.constructor.apply(this, arguments);
    }

    SvgFontView.prototype = Object.create(FontView.prototype, {
        constructor: {
            value: SvgFontView,
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

    /**
     * @private
     * @type {string}
     */
    SvgFontView.prototype._fontType = "svg";

    /**
     * Load the svg font element
     * @private
     * @return jQuery.Deferred
     */
    SvgFontView.prototype._loadFont = function () {
        var deferred = $.Deferred();
        this._file.read(function (error, content, state) {
            if (error === null && content) {
                try {
                    var parsedContent = $.parseXML(content.replace(/\n\r|\n|\r/g, "").match(/<svg.*?<\/svg>/i)[0]);
                    this._$font = $(parsedContent).find("font");
                    if (!this._$font.length || !this._$font.find("glyph").length) {
                        deferred.reject(new Error("Not valid font"));
                    } else {
                        this._fileContent = content;
                        deferred.resolve();
                    }
                } catch (e) {
                    deferred.reject(new Error("Not valid svg"));
                }
            } else {
                deferred.reject(error || new Error("Empty file"));
            }
        }.bind(this));
        return deferred.promise();
    };

    /**
     * Update _glyphs
     * @private
     */
    SvgFontView.prototype._parseFont = function () {
        var glyphs = [];
        this._$font.find("glyph").filter(function () {
            var $this = $(this);
            return $this.attr("d") && $this.attr("unicode");
        }).each(function () {
            var $this = $(this),
                description = {
                    unicode: [],
                    name: []
                },
                i = 0,
                unicode = $this.attr("unicode"),
                hex,
                charEnd,
                char;
            while (i < unicode.length) {
                if (unicode[i] !== "&" || unicode[i + 1] !== "#") {
                    hex = unicode.charCodeAt(i).toString(16);
                    i++;
                } else {
                    charEnd = unicode.indexOf(";", i);
                    char = unicode.substring(i + 1, charEnd - 1);
                    hex = +(char[0] === "x" ? "0" + char : char).toString(16);
                    i = charEnd + 1;
                }
                description.unicode.push(hex);
            }
            if ($this.is("[glyph-name]") && $this.attr("glyph-name")) {
                description.name = $this.attr("glyph-name").split(" ");
            }
            glyphs.push(description);
        });
        glyphs.sort(function (first, second) {
            var properties = ["unicode", "name"],
                j = -1;
            while (++j < properties.length) {
                if (first[properties[j]] && second[properties[j]]) {
                    if (first[properties[j]].length < second[properties[j]].length) {
                        return -1;
                    } else if (first[properties[j]].length > second[properties[j]].length) {
                        return 1;
                    } else {
                        var i = 0;
                        do {
                            if (parseInt(first[properties[j]][i], 16) < parseInt(second[properties[j]][i], 16)) {
                                return -1;
                            } else if (parseInt(first[properties[j]][i], 16) > parseInt(second[properties[j]][i], 16)) {
                                return 1;
                            }
                        } while (++i < first[properties[j]].length);
                    }
                } else if (first[properties[j]]) {
                    return -1;
                } else if (second[properties[j]]) {
                    return 1;
                }
            }
            return 0;
        });
        this._glyphs = glyphs;
    };

    module.exports = SvgFontView;
});
