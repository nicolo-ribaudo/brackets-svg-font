import cp from "child_process";
import path from "path";

const DOMAIN = "brackets-svg-font.fontforge-domain";

let ffInstalled,
    cwd = path.join(__dirname, "fontforge");

let glyphRegExp = /{"unicode":\d+,"name":".*?"}/.source,
    jsonFontRegExp = new RegExp(`\\[${glyphRegExp}(,${glyphRegExp})*\\]`);

function isInstalled(callback) {
    if (ffInstalled !== undefined) {
        callback(ffInstalled ? null : "a");
    } else {
        cp.exec("fontforge -v", (error) => {
            ffInstalled = !error;
            isInstalled(callback);
        });
    }
}

function parse(path, callback) {
    isInstalled((no) => {
        if (no === null) {
            cp.exec(`fontforge -lang=ff -script parser.ff "${path}"`, { cwd }, (error, stdout, stderr) => {
                if (error) {
                    console.log(error);
                    callback(error);
                } else {
                    try {
                        let json = stdout.match(jsonFontRegExp)[0];
                        callback(null, JSON.parse(json));
                    } catch (e) {
                        console.log(e);
                        callback(e);
                    }
                }
            });
        } else {
            callback("FontForge not available");
        }
    });
}

function convert(from, to, callback) {
    isInstalled((no) => {
        if (no === null) {
            cp.exec(`fontforge -lang=ff -script converter.ff "${from}" "${to}"`, { cwd }, (error, stdout, stderr) => {
                if (error) {
                    console.log(error);
                    callback(error);
                } else {
                    callback(null);
                }
            });
        }
    });
}

function init(domainManager) {
    if (!domainManager.hasDomain(DOMAIN)) {
        domainManager.registerDomain(DOMAIN, { major: 0, minor: 2 });
    }

    domainManager.registerCommand(
        DOMAIN,
        "isInstalled",
        isInstalled,
        true,
        "Check if the user has FontForge installed.",
        [],
        []
    );

    domainManager.registerCommand(
        DOMAIN,
        "parse",
        parse,
        true,
        "Get the list of the glyphs in the provided font.",
        [{
            name: "path",
            type: "string",
            description: "The path of the font to parse."
        }],
        [{
            name: "unicodes",
            type: "Array.<number>",
            description: "An array containing all the unicode values of the spported glyphs."
        }]
    );

    domainManager.registerCommand(
        DOMAIN,
        "convert",
        convert,
        true,
        "Convert a font",
        [{
            name: "from",
            type: "string",
            description: "The path of the input file"
        }, {
            name: "to",
            type: "string",
            description: "The path of the converted file"
        }]
    );
}

export { init };