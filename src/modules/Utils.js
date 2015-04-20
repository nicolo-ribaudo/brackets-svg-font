export function getPath(relativePath) {
    let basePath = new Error().stack.match(/^(?:.*?\n){2}.*?at.*?\((?:file:\/\/\/)?(.*?\/)[^\/]*?:\d+:\d+\)\n/)[1];
    if (brackets.platform !== "win") {
        basePath = `/${basePath}`;
    }
    return window.decodeURI(basePath) + relativePath;
}