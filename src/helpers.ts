import * as express from 'express';

export interface IMap<T = any> {
    [key: string]: T;
}
export interface IRequestHandler {
    (req: express.Request, res: express.Response, next?: express.NextFunction): void;
}
export interface IExtendedRequest extends express.Request {
    [key: string]: any;
}

export interface IController {
    options: {
        name: string
    };
    [route: string]: IRequestHandler|any;
}

/**
 * Given a CommonJS/Node path, and differences between ES6 module defaults and Node modules, attempt to return the intended module.
 * @param path CommonJS/Node path used by require to fetch a module
 */
export function flexibleRequire<T>(path: string): T {
    let raw = require(path);
    return raw.default != null ? raw.default : raw;
}
