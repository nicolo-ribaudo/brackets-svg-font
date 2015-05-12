/*jshint proto: true */

import Symbol from "../polyfills/Symbol";

const symbols = Symbol();

export default class SymbolRegistry {

    constructor() {
        this[symbols] = {
            __proto__: null
        };
    }

    get(id) {
        if (!(id in this[symbols])) {
            this[symbols][id] = Symbol(id);
        }
        return this[symbols][id];
    }

}