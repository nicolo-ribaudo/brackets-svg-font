/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global $, brackets, define */

define(function (require, exports, module) {
    "use strict";

    // __ MODULES
    var DocumentManager = brackets.getModule("document/DocumentManager"),
        Editor = brackets.getModule("editor/Editor").Editor,
        LanguageManager = brackets.getModule("language/LanguageManager"),
        SvgFontViewer = require("modules/SvgFontView");

    /**
     * @param {!string} path - The path of the file
     * @return {boolean} Can the file be opened?
     */
    function canOpenFile(path) {
        var language = LanguageManager.getLanguageForPath(path).getId();
        if (language === "svg") {
            return true;
        }
        return false;
    }

    /**
     * @param {!File} file - The font file
     * @param {!Pane} pane - The pane where to create the view
     * @return {jQuery.Promise}
     */
    function openFile(file, pane) {
        var view = pane.getViewForPath(file.fullPath),
            deferred = $.Deferred();
        if (view) {
            pane.showView(view);
            deferred.resolve(file);
        } else {
            view = new SvgFontViewer(file, pane.$el);
            pane.addView(view, true);
            view.promise.then(function () {
                view.create();
                deferred.resolve(file);
            }, function () {
                console.log(arguments);
                DocumentManager.getDocumentForPath(file.fullPath).then(function (document) {
                    var editor = new Editor(document, true, pane.$el);
                    pane.addView(editor, true);
                    deferred.resolve(file);
                }, deferred.reject.bind(deferred));
            });
        }

        return deferred.promise();
    }

    exports.canOpenFile = canOpenFile;
    exports.openFile = openFile;
});