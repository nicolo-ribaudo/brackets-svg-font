import SymbolRegistry from "SymbolRegistry";
import FontView from "FontView";
import svgFontViewGlyphsTpl from "text!../html/svg-font-view-glyphs.html";  // text! comes from require.js

const Symbols = new SymbolRegistry();

class SvgFontView extends FontView {

    /**
     * @override
     */
    _load() {
        let deferred = $.Deferred();

        this.getFile().read((error, content, state) => {
            if (error === null && content) {
                try {
                    let parsedContent = $.parseXML(content.replace(/\n\r|\n|\r/g, "").match(/<svg.*?<\/svg>/i)[0]),
                        $font = $(parsedContent).find("font");
                    if (!$font.length || !$font.find("glyph").length) {
                        deferred.reject(new Error("Not valid font"));
                    } else {
                        this[Symbols.get("font")] = this._sort(this[Symbols.get("parse")]($font));
                        deferred.resolve();
                    }
                } catch (e) {
                    deferred.reject(new Error("Not valid svg"));
                }
            } else {
                deferred.reject(error || new Error("Empty file"));
            }
        });

        return deferred.promise();
    }

    /**
     * @override
     */
    _renderGlyphs(maxGlyphsPerLine) {
        return Mustache.render(svgFontViewGlyphsTpl, {
            glyphs: this[Symbols.get("font")].glyphs,
            size: this[Symbols.get("font")].size,
            emptyBlocks: new Array(maxGlyphsPerLine)
        });
    }

    /**
     * @override
     */
    _sort(font) {
        font.glyphs = super._sort(font.glyphs);
        return font;
    }

    /**
     * Parse the svg file
     * @private
     * @param {jQuery} $font - The svg's font tag
     * @return {size:{from:int,to:int},glyphs:Array.{unicode:String,name:String}}
     */
    [Symbols.get("parse")]($font) {
        let $fontFace = $font.find("font-face"),
            descent = +$fontFace.attr("descent"),
            ascent = +$fontFace.attr("ascent"),
            glyphs = $font.find("glyph").get().reduce((glyphs, glyph) => {
                let $glyph = $(glyph),
                    unicode = $glyph.attr("unicode"),
                    d = $glyph.attr("d");

                if (unicode && d) {
                    let description = {
                        name: $glyph.attr("glyph-name"),
                        path: d
                    },
                        i = 0;

                    while (i < unicode.length) {
                        let hex;

                        if (unicode[i] !== "&" || unicode[i + 1] !== "#") {
                            hex = unicode.charCodeAt(i).toString(16);
                            i++;
                        } else {
                            let charEnd = unicode.indexOf(";", i),
                                char = unicode.substring(i + 1, charEnd - 1);
                            hex = +(char[0] === "x" ? `0${char}` : char).toString(16);
                            i = charEnd + 1;
                        }

                        description.unicode = hex;
                    }

                    glyphs.push(description);
                }

                return glyphs;
            }, []);

        return {
            size: {
                from: descent,
                to: ascent - 2 * descent
            },
            glyphs
        };
    }
}

Mustache.parse(svgFontViewGlyphsTpl);

export default SvgFontView;