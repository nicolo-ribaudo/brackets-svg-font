/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global brackets, define */

define(function (require, exports, module) {
    "use strict";
    
    // -- MODULES
    var ConsoleUtils = require("modules/ConsoleUtils"),
        LanguageManager = brackets.getModule("language/LanguageManager"),
        MainViewFactory = brackets.getModule("view/MainViewFactory"),
        SvgFontViewFactory = require("modules/SvgFontViewFactory");
    
    if (!LanguageManager.getLanguage("svg")) {
        LanguageManager.getLanguage("xml").removeFileExtension("svg");
        ConsoleUtils.disable("warn"); // That's beacuse brackets shows a warning in the console: the xml mode is already used by another language
        LanguageManager.defineLanguage("svg", {
            name: "SVG",
            fileExtensions: ["svg"],
            mode: "xml",
            blockComment: ["<!--", "-->"]
        });
        ConsoleUtils.enable();
    }
    
    MainViewFactory.registerViewFactory(SvgFontViewFactory);
});