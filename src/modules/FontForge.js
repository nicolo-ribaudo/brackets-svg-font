import { getPath } from "Utils";

const DOMAIN_NAME = "brackets-svg-font.fontforge-domain",
      DOMAIN_PATH = getPath("../node/FontForgeDomain.js");

let ExtensionUtils = brackets.getModule("utils/ExtensionUtils"),
    NodeDomain = brackets.getModule("utils/NodeDomain");

let FontForge;

function exec() {
    if (!FontForge) {
        FontForge = new NodeDomain(DOMAIN_NAME, DOMAIN_PATH);
    }
    return FontForge.exec(...arguments);
}

export let isInstalled = () => exec("isInstalled");
export let parse = (path) => exec("parse", path);