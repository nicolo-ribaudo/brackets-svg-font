/*jslint regexp: true */
/*global $, brackets, define, Mustache */

define(function (require, exports, module) {
    "use strict";

    // -- MODULES
    var ExtensionUtils = brackets.getModule("utils/ExtensionUtils"),
        WorkspaceManager = brackets.getModule("view/WorkspaceManager"),
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
        this._file = file;
        this.promise = this._refresh();
        this._$container = $container;
        this.$el = $(Mustache.render(fontViewerContainerTemplate, {
            path: file.fullPath,
            type: this._fontType
        })).on("mouseenter", ".glyph", function () {
            var $this = $(this),
                equator = $this.parents("[data-id='font-view']").height() / 2;
            $this.addClass("open");
            if ($this.position().top > equator) {
                $this.addClass("to-top");
            }
        }).on("mouseleave", ".glyph", function () {
            $(this).removeClass("open").removeClass("to-top");
        });
    }

    /**
     * @private
     * @type {jQuery}
     */
    SvgFontView.prototype._$container = null;

    /**
     * @private
     * @type {jQuery}
     */
    SvgFontView.prototype._$font = null;
    
    /**
     * @private
     + @type {Boolean}
     */
    SvgFontView.prototype._created = null;

    /**
     * @private
     * @type {File}
     */
    SvgFontView.prototype._file = null;
    
    /**
     * @private
     * @type {String}
     */
    SvgFontView.prototype._fileContent = null;

    /**
     * @private
     * @type {string}
     */
    SvgFontView.prototype._fontType = "svg";

    /**
     * An array of font's glyphs
     * @private
     * @type {Array.<Object>}
     */
    SvgFontView.prototype._glyphs = null;

    /**
     * @private
     * @type {Number}
     */
    SvgFontView.prototype._maxGlyphsPerLine = null;

    /**
     * @type {jQuery}
     */
    SvgFontView.prototype.$el = null;

    /**
     * @type {jQuery.Promise}
     */
    SvgFontView.prototype.promise = null;

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
                    this._fileContent = content;
                    deferred.resolve(this._$font);
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
        var $glyphs = this._$font.find("glyph").filter(function () {
            var $this = $(this);
            return ($this.attr("d") || $this.children().length) && ($this.attr("unicode") || $this.attr("glyph-name"));
        }),
            glyphs = [];
        $glyphs.each(function () {
            var $this = $(this),
                description = {
                    unicode: [],
                    name: []
                },
                i = 0;
            if ($this.is("[unicode]")) {
                var unicode = $this.attr("unicode"),
                    hex,
                    charEnd,
                    char;
                if (unicode !== "") {
                    while (i < unicode.length) {
                        if (unicode[i] !== "&") {
                            hex = unicode[i].charCodeAt(0).toString(16);
                            i++;
                        } else {
                            charEnd = unicode.indexOf(";", i);
                            char = unicode.substring(i + 1, charEnd - 1);
                            hex = +(char[0] === "x" ? "0" + char : char).toString(16);
                            i = charEnd + 1;
                        }
                        description.unicode.push(hex);
                    }
                }
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
                            if (first[properties[j]][i].dec < second[properties[j]][i].dec) {
                                return -1;
                            } else if (first[properties[j]][i].dec > second[properties[j]][i].dec) {
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
        this._maxGlyphsPerLine = Math.floor(screen.width / 100);
    };

    /**
     * @private
     * @return jQuery.Promise
     */
    SvgFontView.prototype._refresh = function () {
        var deferred = $.Deferred();
        this._loadFont().then(function () {
            this._parseFont();
            deferred.resolve();
        }.bind(this), deferred.reject.bind(deferred));
        return deferred.promise();
    };

    /**
     * Render the glyphs
     * @private
     */
    SvgFontView.prototype._render = function () {
        var emptyBlocks = [],
            $glyphs;
        emptyBlocks.length = this._maxGlyphsPerLine;
        $glyphs = $(Mustache.render(fontViewerGlyphsTemplate, {
            glyphs: this._glyphs,
            emptyBlocks: emptyBlocks
        }));
        this.$el.find(".font-container > div").html("").append($glyphs);
    };

    /**
     * Called to restore the scroll state and adjust the height by heightDelta.
     * @return {Object}
     */
    SvgFontView.prototype.adjustScrollPos = function () {};

    /**
     * Append the view to the pane
     */
    SvgFontView.prototype.create = function () {
        this._created = true;
        this._$container.find(".pane-content").append(this.$el);
        this.updateLayout();
    };

    /**
     * Called when the view is no longer needed.
     */
    SvgFontView.prototype.destroy = function () {
        this.$el.remove();
    };

    /**
     * Called to tell the view to take focus
     */
    SvgFontView.prototype.focus = function () {};

    /**
     * @return {File} File object that belongs to the view (may return null)
     */
    SvgFontView.prototype.getFile = function () {
        return this._file;
    };

    /**
     * Called to get the current view scroll state.
     * @param {Object} state
     * @param {Number} heightDelta
     */
    SvgFontView.prototype.getScrollPos = function () {};

    /**
     * Tells the view to do ignore any cached layout data and do a complete layout of its content.
     * @param {Boolean} forceRefresh
     */
    SvgFontView.prototype.updateLayout = function (forceRefresh) {
        var deferred = $.Deferred();
        if (forceRefresh) {
            this._refresh().then(function () {
                this.updateLayout();
                deferred.resolve();
            }.bind(this), deferred.reject.bind(deferred));
        } else {
            this._render();
            deferred.resolve();
        }
        return deferred.promise();
    };

    module.exports = SvgFontView;
});
