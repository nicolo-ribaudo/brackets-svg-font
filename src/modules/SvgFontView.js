import Symbol from "../polyfills/Symbol";
import FontView from "FontView";
import svgFontViewGlyphsTpl from "text!../html/svg-font-view-glyphs.html";  // text! comes from require.js

const SYMBOLS = [ "parse", "font" ].reduce((symbols, name) => {
    symbols[name] = Symbol(name);
    return symbols;
}, {});

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
                        this[SYMBOLS.font] = this._sort(this[SYMBOLS.parse]($font));
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
            glyphs: this[SYMBOLS.font].glyphs,
            size: this[SYMBOLS.font].size,
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
     * @return {size:{upe:String,descendent:String},glyphs:Array.{unicode:String,name:String}}
     */
    [SYMBOLS.parse]($font) {
        let $fontFace = $font.find("font-face"),
            upe = $fontFace.attr("units-per-em"),
            descent = $fontFace.attr("descent"),
            glyphs = [].reduce.call($font.find("glyph"), (glyphs, glyph) => {
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
            size: { upe, descent },
            glyphs
        };
    }
}

Mustache.parse(svgFontViewGlyphsTpl);

export default SvgFontView;