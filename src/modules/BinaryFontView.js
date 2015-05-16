import SymbolRegistry from "./SymbolRegistry";
import FontView       from "./FontView";
import * as FontForge from "./FontForge";
import binaryFontViewGlyphsTpl from "text!../html/binary-font-view-glyphs.html";  // text! comes from require.js

const Symbols = new SymbolRegistry();

class BinaryFontView extends FontView {

    /**
     * @override
     */
    constructor(file) {
        super(...arguments);
        this[Symbols.get("type")] = this[Symbols.get("getType")](file);
    }

    /**
     * @override
     */
    _load() {
        return FontForge.parse(this.getFile().fullPath).then((font) => {
            font.forEach((glyph) => glyph.unicode = glyph.unicode.toString(16));
            this[Symbols.get("font")] = this._sort(font);
        });
    }

    /**
     * @override
     */
    _renderGlyphs(maxGlyphsPerLine) {
        return Mustache.render(binaryFontViewGlyphsTpl, {
            glyphs: this[Symbols.get("font")],
            emptyBlocks: new Array(maxGlyphsPerLine),
            path: this.getFile().fullPath,
            type: this[Symbols.get("type")]
        });
    }

    /**
     * Get the type of a font file
     * @param {File}
     * @return {String}
     */
    [Symbols.get("getType")](file) {
        let extension = file.fullPath.match(/[a-z]+$/i)[0];
        return ({
            otf: "OpenType",
            ttf: "TrueType"
        })[extension] || extension;
    }
}

Mustache.parse(binaryFontViewGlyphsTpl);

export default BinaryFontView;