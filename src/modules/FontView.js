import SymbolRegistry from "./SymbolRegistry";
import fontViewContainerTpl from "text!../html/font-view-container.html"; // text! comes from require.js

const Symbols = new SymbolRegistry();

let ExtensionUtils = brackets.getModule("utils/ExtensionUtils"),
    WorkspaceManager = brackets.getModule("view/WorkspaceManager");

/**
 * @abstract
 */
class FontView {

    /*
     * @param {File} file - The font file to render
     * @param {jQuery} $container - The element to render the font view in
     */
    constructor(file, $container) {
        if (Object.getPrototypeOf(this) === FontView.prototype) {
            throw new Error("FontView is an abstract class: it can't be directly instantiated.");
        }

        this[Symbols.get("$container")] = $container;
        this[Symbols.get("created")] = false;
        this[Symbols.get("file")] = file;
        this[Symbols.get("maxGlyphsPerLine")] = Math.floor(screen.width / 100);
        this[Symbols.get("promise")] = this[Symbols.get("load")]();

        this.$el = $(Mustache.render(fontViewContainerTpl, {
            path: file.fullPath
        })).on("mouseenter", ".glyph", function () {
            let $this = $(this),
                equator = $this.parents(".font-view").height() / 2,
                scrollPos = $this.parents(".font-container").scrollTop(),
                top = $this.position().top;
            if (top - scrollPos > equator) {
                $this.addClass("to-top");
            }
        }).on("mouseleave", ".glyph", function () {
            $(this).removeClass("open to-top");
        });
    }

    /**
     * Called to restore the scroll state and adjust the height by heightDelta.
     * @public
     * @return {Object}
     */
    adjustScrollPos() {}

    /**
     * Append the view to the pane
     * @public
     */
    create() {
        this[Symbols.get("$container")].find(".pane-content").append(this.$el);
        this.updateLayout();
    }

    /**
     * Called when the view is no longer needed.
     * @public
     */
    destroy() {
        this.$el.remove();
    }

    /**
     * Called to tell the view to take focus
     * @public
     */
    focus() {}

    /**
     * @public
     * @return {File} File object that belongs to the view (may return null)
     */
    getFile() {
        return this[Symbols.get("file")];
    }

    /**
     * Called to get the current view scroll state.
     * @param {Object} state
     * @param {Number} heightDelta
     */
    getScrollPos() {}

    /**
     * Tells the view to do ignore any cached layout data and do a complete layout of its content.
     * @public
     * @param {Boolean} forceRefresh
     */
    updateLayout(forceRefresh) {
        if (forceRefresh || !this[Symbols.get("loaded")]) {
            return this[Symbols.get("load")]().then(() => this.updateLayout());
        } else {
            this[Symbols.get("render")]();
        }
    }

    /*
     * A promise representing the loading state
     * @public
     * @type {$.Promise}
     */
    promise() {
        return this[Symbols.get("promise")];
    }

    /**
     * Load the font
     * @abstract
     * @protected
     */
    _load() {}

    /**
     * Render font glyphs
     * @abstract
     * @protected
     * @param {Integer} maxGlyphsPerLine
     * @return {String}
     */
    _renderGlyphs(maxGlyphsPerLine) {}

    /**
     * Sort the glyphs by the unicode value
     * @protected
     * @param {Array} glyphs
     * @return {Array} The sorted list of glyphs
     */
    _sort(glyphs) {
        return glyphs.sort((first, second) => parseInt(first.unicode, 16) > parseInt(second.unicode, 16) ? 1: -1);
    }

    /**
     * Load the font and set [Symbol(loaded)] to true
     * @return {$.Promise}
     */
    [Symbols.get("load")]() {
        return this._load().then(() => this[Symbols.get("loaded")] = true);
    }

    /**
     * Render glyphs
     * @private
     */
    [Symbols.get("render")]() { // jshint ignore:line, jshint/jshint#2350
        this.$el.find(".font-container > div").html("").append(this._renderGlyphs(this[Symbols.get("maxGlyphsPerLine")]));
    }

}

Mustache.parse(fontViewContainerTpl);

export default FontView;