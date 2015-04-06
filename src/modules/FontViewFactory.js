import SvgFontView from "SvgFontView";
import BinaryFontView from "BinaryFontView";
import { isInstalled } from "FontForge";

let DocumentManager = brackets.getModule("document/DocumentManager"),
    Editor          = brackets.getModule("editor/Editor").Editor;

let ffInstalled = isInstalled();

export default {

    /**
     * @param {!string} path - The path of the file
     * @return {boolean} Can the file be opened?
     */
    canOpenFile: (path) => (/\.(svg|otf|ttf|woff)$/i).test(path),

    /**
     * @param {!File} file - The font file
     * @param {!Pane} pane - The pane where to create the view
     * @return {jQuery.Promise}
     */
    openFile: (file, pane) => {
        let view = pane.getViewForPath(file.fullPath);

        if (view) {
            pane.showView(view);
            return $.Deferred().resolve().promise();
        } else if (/\.svg$/i.test(file.fullPath)) {
            view = new SvgFontView(file, pane.$el);
            pane.addView(view, true);

            return view.promise().fail(() => DocumentManager.getDocumentForPath(file.fullPath).then(document => {
                let editor = new Editor(document, true, pane.$el);
                pane.addView(editor, true);
                return $.Deferred().resolve().promise();
            }));
        } else {
            return ffInstalled.then(() => {
                view = new BinaryFontView(file, pane.$el);
                pane.addView(view, true);
                return view.promise();
            }).fail((...args) => console.log(...args));
        }
    }
};
