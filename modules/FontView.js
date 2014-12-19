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
     * Get the current theme's background color
     */
    function _getBgColor() {
        var $CM = $("<div class='CodeMirror'>").appendTo("#editor-holder"),
            bgColor = $CM.css("background-color");
        $CM.remove();
        return bgColor;
    }

    /**
     * @constructor
     * @abstract
     * @param {File} file - The font file to render
     * @param {jQuery} $container - The element to render the font view in
     */
    function FontView(file, $container) {
        if (Object.getPrototypeOf(this) === FontView.prototype) {
            throw new Error("FontView is an abstract class: it can't be directly instantiated.");
        }

        this._file = file;
        this._promise = this._refresh();
        this._$container = $container;
        this.$el = $(Mustache.render(fontViewerContainerTemplate, {
            path: file.fullPath,
            type: this._fontType,
            background: _getBgColor()
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
    FontView.prototype._$container = null;

    /**
     * @private
     * @type {jQuery}
     */
    FontView.prototype._$font = null;

    /**
     * @private
     + @type {Boolean}
     */
    FontView.prototype._created = null;

    /**
     * @private
     * @type {File}
     */
    FontView.prototype._file = null;

    /**
     * @private
     * @type {String}
     */
    FontView.prototype._fileContent = null;

    /**
     * @private
     * @type {string}
     */
    FontView.prototype._fontType = "";

    /**
     * An array of font's glyphs
     * @private
     * @type {Array.<Object>}
     */
    FontView.prototype._glyphs = null;

    /**
     * @private
     * @type {Number}
     */
    FontView.prototype._maxGlyphsPerLine = Math.floor(screen.width / 100);

    /**
     * @type {jQuery}
     */
    FontView.prototype.$el = null;

    /**
     * @type {jQuery.Promise}
     */
    FontView.prototype._promise = null;

    /**
     * Load the font element
     * @private
     * @return jQuery.Deferred
     */
    FontView.prototype._loadFont = function () {};

    /**
     * Update _glyphs
     * @private
     */
    FontView.prototype._parseFont = function () {};

    /**
     * @private
     * @return jQuery.Promise
     */
    FontView.prototype._refresh = function () {
        return this._loadFont().then(this._parseFont.bind(this));
    };

    /**
     * Render the glyphs
     * @private
     */
    FontView.prototype._render = function () {
        var emptyBlocks = [],
            $glyphs;
        emptyBlocks.length = this._maxGlyphsPerLine;
        $glyphs = $(Mustache.render(fontViewerGlyphsTemplate, {
            glyphs: this._glyphs,
            emptyBlocks: emptyBlocks
        }));
        this.$el.find(".font-container > div").html("").append($glyphs);
    };

    FontView.prototype._sort = function () {
        this._glyphs.sort(function (first, second) {
            var j = -1;
            if (first.unicode.length < second.unicode.length) {
                return -1;
            } else if (first.unicode.length > second.unicode.length) {
                return 1;
            } else {
                var i = 0;
                do {
                    if (parseInt(first.unicode[i], 16) < parseInt(second.unicode[i], 16)) {
                        return -1;
                    } else if (parseInt(first.unicode[i], 16) > parseInt(second.unicode[i], 16)) {
                        return 1;
                    }
                } while (++i < first.unicode.length);
            }
            return 0;
        });
    };

    /**
     * Called to restore the scroll state and adjust the height by heightDelta.
     * @return {Object}
     */
    FontView.prototype.adjustScrollPos = function () {};

    /**
     * Append the view to the pane
     */
    FontView.prototype.create = function () {
        this._created = true;
        this._$container.find(".pane-content").append(this.$el);
        this.updateLayout();
    };

    /**
     * Called when the view is no longer needed.
     */
    FontView.prototype.destroy = function () {
        this.$el.remove();
    };

    /**
     * Called to tell the view to take focus
     */
    FontView.prototype.focus = function () {};

    /**
     * @return {File} File object that belongs to the view (may return null)
     */
    FontView.prototype.getFile = function () {
        return this._file;
    };

    /**
     * Called to get the current view scroll state.
     * @param {Object} state
     * @param {Number} heightDelta
     */
    FontView.prototype.getScrollPos = function () {};

    FontView.prototype.promise = function () {
        return this._promise;
    };

    /**
     * Tells the view to do ignore any cached layout data and do a complete layout of its content.
     * @param {Boolean} forceRefresh
     */
    FontView.prototype.updateLayout = function (forceRefresh) {
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

    module.exports = FontView;
});
