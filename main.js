/*global brackets, define */

define(function (require, exports, module) {
    "use strict";
    
    // -- MODULES
    var LanguageManager = brackets.getModule("language/LanguageManager"),
        MainViewFactory = brackets.getModule("view/MainViewFactory"),
        FontViewFactory = require("modules/FontViewFactory");

    MainViewFactory.registerViewFactory(FontViewFactory);
});
