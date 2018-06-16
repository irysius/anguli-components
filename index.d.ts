declare module "@irysius/anguli-components/ControllerRouter" {
    import { ILogger } from "@irysius/utils";
    import * as express from "express";
    export interface IControllerRouterOptions {
        express: typeof express;
        logger?: ILogger;
    }
    export function ControllerRouter(options: IControllerRouterOptions): {
        setup: (app: express.Application, rootFolder: string) => {};
    };
}
declare module "@irysius/anguli-components/ErrorHandler" {
    import * as express from "express";
    export function controller(req: express.Request, res: express.Response): (error: Error) => void;
    export function socket(done: any): (error: Error) => void;
}
declare module "@irysius/anguli-components/helpers" {
    import * as express from "express";
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
            name: string;
        };
        [route: string]: IRequestHandler | any;
    }
    export interface IHub {
        options: {
            name: string;
        };
        connect(socket: any): void;
        send: IMap<Function>;
        receive: IMap<Function>;
        disconnect(socket: any): void;
    }
}
declare module "@irysius/anguli-components/Hub" {
    import { IHub } from "@irysius/anguli-components/helpers";
    import * as io from "socket.io";
    export function Hub(rawHub: IHub, name: string, io: io.Server): {
        io: io.Namespace;
        options: {
            name: string;
        };
        connect: (socket: any) => void;
        send: {};
    };
}
declare module "@irysius/anguli-components/HubRouter" {
    import { ILogger } from "@irysius/utils";
    import { IHub, IMap } from "@irysius/anguli-components/helpers";
    import * as io from "socket.io";
    export interface IHubRouterOptions {
        io: io.Server;
        logger?: ILogger;
    }
    export function HubRouter(options: IHubRouterOptions): {
        setup: (rootFolder: string) => IMap<IHub>;
    };
}
declare module "@irysius/anguli-components" {
    import * as _ControllerRouter from "@irysius/anguli-components/ControllerRouter";
    import * as _ErrorHandler from "@irysius/anguli-components/ErrorHandler";
    import * as _helpers from "@irysius/anguli-components/helpers";
    import * as _Hub from "@irysius/anguli-components/Hub";
    import * as _HubRouter from "@irysius/anguli-components/HubRouter";
    export let ControllerRouter: typeof _ControllerRouter;
    export let ErrorHandler: typeof _ErrorHandler;
    export let helpers: typeof _helpers;
    export let Hub: typeof _Hub;
    export let HubRouter: typeof _HubRouter;
}