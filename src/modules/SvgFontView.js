/*jshint elision: true */

import SymbolRegistry from "./SymbolRegistry";
import FontView       from "./FontView";
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
            size,
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

                    size = this[Symbols.get("getGlyphSize")](d, size);
                }

                return glyphs;
            }, []);

        return {
            size,
            glyphs
        };
    }

    *[Symbols.get("parseSvgPath")](d) { // jshint ignore:line
        let commands = "mzlhvcsqta",
            numberRegExp = /[+-]?[\d\.]+(?:e[+-]?[\d\.]+)?/.source,
            prev = { x: 0, y: 0 };
        for (let i = 0; i < d.length; i++) {
            let ch = d[i].toLowerCase();
            if (~commands.indexOf(ch)) {
                let re = {
                        start: `^.{${i + 1}}[^${commands}]*?`,
                        end: `\\s*(?:[${commands}]|$)`
                    },
                    coords = {};
                switch (ch) {
                    case "m":
                    case "l":
                    case "c":
                    case "s":
                    case "q":
                    case "t":
                    case "a":
                        [ , coords.x, coords.y ] = d.match(new RegExp(`${re.start}(${numberRegExp})\\s*,?\\s*(${numberRegExp})${re.end}`, "i"));
                        break;
                    case "h":
                    case "v":
                        coords[ ch === "h" ? "x" : "y" ] = d.match(new RegExp(`${re.start}(${numberRegExp})${re.end}`, "i"))[1];
                        break;
                }
                coords.x = +coords.x || 0;
                coords.y = +coords.y || 0;
                if (ch === d[i]) {
                    coords.x += prev.x;
                    coords.y += prev.y;
                }
                yield (prev = coords);
            }
        }
    }

    [Symbols.get("getGlyphSize")](d, prev = { top: 0, bottom: 0, right: 0, left: 0 }) { // jshint ignore:line
        for (let { x, y } of this[Symbols.get("parseSvgPath")](d)) {
            prev.top = Math.max(prev.top, y);
            prev.bottom = Math.min(prev.bottom, y);
            prev.right = Math.max(prev.right, x);
            prev.left = Math.min(prev.left, x);
        }
        return prev;
    }
}

Mustache.parse(svgFontViewGlyphsTpl);

export default SvgFontView;