import { convert } from "FontForge";
import { showBusyStatus, hideBusyStatus } from "StatusBarUtils";
import convertDialogTpl from "text!../html/convert-dialog.html";  // text! comes from require.js

const CMD_CONVERT = "brackets-svg-font.convert";

let CommandManager = brackets.getModule("command/CommandManager"),
    Dialogs        = brackets.getModule("widgets/Dialogs"),
    DefaultDialogs = brackets.getModule("widgets/DefaultDialogs"),
    Menus          = brackets.getModule("command/Menus"),
    ProjectManager = brackets.getModule("project/ProjectManager");

let fontTypes = {
    svg: "SVG",
    ttf: "TrueType",
    otf: "OpenType",
    woff: "WOFF"
},
    fontRegExp = new RegExp(`\\.(?:${Object.keys(fontTypes).join("|")})$`, "i"),
    fileNameRegExp = new RegExp(`[^\\/]+${fontRegExp.source}`);

let convertDialogHtml = Mustache.render(convertDialogTpl, {
    fontTypes: Object.keys(fontTypes).map((id) => {
        return {
            id,
            name: fontTypes[id]
        };
    })
});

let projectCtxMenu = Menus.getContextMenu(Menus.ContextMenuIds.PROJECT_MENU),
    cmdConvert = CommandManager.register("Convert", CMD_CONVERT, () => {
        let from = ProjectManager.getSelectedItem().fullPath,
            dialog = Dialogs.showModalDialog(
                CMD_CONVERT,
                "Which format do you want to convert the font into?",
                convertDialogHtml,
                [{
                    className: Dialogs.DIALOG_BTN_CLASS_PRIMARY,
                    id: Dialogs.DIALOG_BTN_OK,
                    text: "Convert!"
                }, {
                    className: Dialogs.DIALOG_BTN_CLASS_NORMAL,
                    id: Dialogs.DIALOG_BTN_CANCEL,
                    text: "Cancel"
                }]
            );

        return dialog.getPromise().then(buttonId => {
            if (buttonId === Dialogs.DIALOG_BTN_OK) {
                let outputType = dialog.getElement().find("select").val(),
                    to = from.replace(/\.[a-z]+$/i, `.${outputType}`);

                showBusyStatus(`Converting ${from.match(fileNameRegExp)[0]} into ${to.match(fileNameRegExp)[0]}`);

                return convert(from, to).then(() => hideBusyStatus());
            }
        });
    });

projectCtxMenu.addMenuDivider();
projectCtxMenu.addMenuItem(cmdConvert);
projectCtxMenu.on("beforeContextMenuOpen", () => {
    let selected = ProjectManager.getSelectedItem();
    cmdConvert.setEnabled(selected.isFile && fontRegExp.test(selected.fullPath));
});