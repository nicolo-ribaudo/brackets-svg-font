/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global brackets, define */

define(function (require, exports, module) {
    "use strict";
    
    // -- MODULES
    var LanguageManager = brackets.getModule("language/LanguageManager"),
        MainViewFactory = brackets.getModule("view/MainViewFactory"),
        SvgFontViewFactory = require("modules/SvgFontViewFactory");

    MainViewFactory.registerViewFactory(SvgFontViewFactory);
});
