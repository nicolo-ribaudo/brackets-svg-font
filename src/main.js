import FontViewFactory from "modules/FontViewFactory";
import { getPath } from "modules/Utils";
import "modules/Converter";
import "modules/OnlineTrackingClient";

let ExtensionUtils  = brackets.getModule("utils/ExtensionUtils"),
    MainViewFactory = brackets.getModule("view/MainViewFactory");

ExtensionUtils.addLinkedStyleSheet(getPath("style/main.css"));

MainViewFactory.registerViewFactory(FontViewFactory);