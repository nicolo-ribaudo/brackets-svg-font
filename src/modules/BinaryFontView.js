import Symbol from "../polyfills/Symbol";
import FontView from "FontView";
import * as FontForge from "FontForge";
import binaryFontViewGlyphsTpl from "text!../html/binary-font-view-glyphs.html";  // text! comes from require.js

const SYMBOLS = [ "getType", "font", "type" ].reduce((symbols, name) => {
    symbols[name] = Symbol(name);
    return symbols;
}, {});

class BinaryFontView extends FontView {

    /**
     * @override
     */
    constructor(file) {
        super(...arguments);
        this[SYMBOLS.type] = this[SYMBOLS.getType](file);
    }

    /**
     * @override
     */
    _load() {
        return FontForge.parse(this.getFile().fullPath).then((font) => {
            font.forEach((glyph) => glyph.unicode = glyph.unicode.toString(16));
            this[SYMBOLS.font] = this._sort(font);
        });
    }

    /**
     * @override
     */
    _renderGlyphs(maxGlyphsPerLine) {
        return Mustache.render(binaryFontViewGlyphsTpl, {
            glyphs: this[SYMBOLS.font],
            emptyBlocks: new Array(maxGlyphsPerLine),
            path: this.getFile().fullPath,
            type: this[SYMBOLS.type]
        });
    }

    /**
     * Get the type of a font file
     * @param {File}
     * @return {String}
     */
    [SYMBOLS.getType](file) {
        let extension = file.fullPath.match(/[a-z]+$/i)[0];
        return ({
            otf: "OpenType",
            ttf: "TrueType"
        })[extension] || extension;
    }
}

Mustache.parse(binaryFontViewGlyphsTpl);

export default BinaryFontView;