import * as _ from 'lodash';
import * as express from 'express';
import { IRequestHandler } from './helpers';


function authenticate2(controller, onFail?: IRequestHandler) {
    if (!_.isFunction(onFail)) { 
        onFail = rejectWithJson(); 
    }
    Object.keys(controller).forEach(key => {
		if (_.isFunction(controller[key])) {
			authenticate3(controller, key, onFail);
		}
	});
}
function authenticate3(controller, actionName: string, onFail: IRequestHandler) {
    if (!_.isFunction(onFail)) { 
        onFail = rejectWithJson(); 
    }
	let original: IRequestHandler = controller[actionName];
	controller[actionName] = function wrapper(req, res: express.Response) {
		if (!req.user) {
			onFail(req, res);
		} else {
			original(req, res);
		}
	};
}

export interface IAuthenticate {
    (controller): void;
    (controller, onFail: IRequestHandler): void;
    (controller, actionName: string, onFail: IRequestHandler): void;
}
export let authenticate: IAuthenticate = function (controller, ...args: any[]) {
    if (!controller) { 
        throw new Error('Cannot extend controller action with authentication without a controller.'); 
    }
    switch (args.length) {
        case 0:
            authenticate2(controller);
            break;
        case 1:
            authenticate2(controller, args[0]);
            break;
        case 2:
            authenticate3(controller, args[0], args[1]);
            break;
        default: 
            throw new Error('Cannot extend controller action with an invalid number of arguments.');
    }
};

interface IErrorJson {
    error: string;
}
export function rejectWithJson(message: IErrorJson = { error: 'forbidden' }): IRequestHandler {
    return function (req: express.Request, res: express.Response) {
        res.status(403).json(message);
    };
}
export function rejectWithRedirect(path: string = '/'): IRequestHandler {
    return function (req: express.Request, res: express.Response) {
        res.redirect(path);
    };
}