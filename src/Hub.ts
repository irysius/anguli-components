import * as io from 'socket.io';

type HubSendFilter = string; // room or id

/**
 * Interface for a Hub template. To "activate" this template, run it through augmentHub.
 * Do not run the template through augmentHub more than once.
 */
export interface HubTemplate<R = any, S = any> {
    path: string;
	/**
	 * On connect, the socket that connected will be passed, perform any initialization code here.
	 */
	connect?(this: HubSend<S>, socket: io.Socket): void;
	/**
	 * send should be a hash of types, keyed by the expected method name.
	 */
	sendTypes: S;
	/**
	 * receive should be a hash of functions that will be called when the server gets a message from the client.
	 */
	receive: HubReceive<R, S>;
	/**
	 * On disconnect, the socket that disconnected will be passed, perform any cleanup code here.
	 */
    disconnect?(this: HubSend<S>, socket: io.Socket, reason: string): void;
}
export interface Hub<R = any, S = any> extends HubTemplate<R, S> {
    send: HubSend<S>;
    room: io.Namespace;
}
export type HubSend<S = any> = {
    [P in keyof S]: (payload: S[P], roomOrId?: HubSendFilter) => void;
}
export type HubReceive<R = any, S = any> = {
    [P in keyof R]: (this: HubSend<S>, data: R[P], socket: io.Socket) => void;
}

export type Middleware = (socket: io.Socket, next: (err?: any) => void) => void;
/**
 * Method used to activate a Hub template and make the template "live".
 * @param hub The base Hub template to turn "active". Expect the `connect`, `disconnect`, and `receive` functions to be "live" after augment.
 * @param io A socket.io server that's used to create the hub.
 * @returns A HubSend object, tagged with the methods you can use to send data to the client.
 */
export function augmentHub<R, S>(hub: HubTemplate<R, S>, io: io.Server, middlewares?: Middleware[]): HubSend<S> {
    let { path, connect, disconnect, sendTypes, receive } = hub;
    let nsp = io.of(path);
    (middlewares || []).forEach(middleware => {
        nsp.use(middleware);
    });

	// Create the HubSend based on sendTypes
    let _send: HubSend<S> = {} as any;
    function createSends() {
        Object.keys(sendTypes).forEach(eventName => {
            _send[eventName] = function (payload, roomOrId?) {
				if (roomOrId != null) {
					nsp.to(roomOrId).emit(eventName, payload);
				} else {
					nsp.emit(eventName, payload);
				}
            };
        });
    }
	createSends();
	// Augment the original template with HubSend
    (hub as Hub<R, S>).send = _send;
    (hub as Hub<R, S>).room = nsp;

	// Bind each connecting socket to events defined by receive
    function listenToSocket(socket: io.Socket) {
        Object.keys(receive).forEach(eventName => {
            socket.on(eventName, data => {
                receive[eventName].bind(_send)(data, socket);
            });
        });
    }

    nsp.on('connect', socket => {
        connect && connect.bind(_send)(socket);
        listenToSocket(socket);
        socket.on('disconnect', (reason: string) => {
            disconnect && disconnect.bind(_send)(socket, reason);
        });
    });

    return _send;
}