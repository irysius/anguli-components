export interface ClientTemplate<R = any, S = any> {
    path: string;
    connect(this: ClientSend<S>): void;
    reconnect(this: ClientSend<S>, attemptNumber: number): void;
    sendTypes: S;
    receive: ClientReceive<R, S>;
    disconnect(reason: string): void;
}
export interface Client<R = any, S = any> extends ClientTemplate<R, S> {
    send: ClientSend<S>;
    open(): void;
    close(): void;
}
export type ClientSend<S = any> = {
    [P in keyof S]: (payload: S[P]) => void;
}
export type ClientReceive<R = any, S = any> = {
    [P in keyof R]: (this: ClientSend<S>, data: R[P]) => void;
}

export function augmentClient<R, S>(client: ClientTemplate<R, S>, io: SocketIOClientStatic): Client<R, S> {
    let { path, connect, reconnect, disconnect, sendTypes, receive } = client;
    let socket = io(path, { autoConnect: false });

    // Create the ClientSend based on sendTypes
    let _send: ClientSend<S> = {} as any;
    function createSends() {
        Object.keys(sendTypes).forEach(eventName => {
            _send[eventName] = function (payload) {
                socket.emit(eventName, payload);
            };
        });
    }
    createSends();
    // Augment the original template with ClientSend and socket
    (client as Client<R, S>).send = _send;
    (client as Client<R, S>).open = socket.open;
    (client as Client<R, S>).close = socket.close;

    socket.on('connect', () => {
        connect.bind(_send)();
    });
    socket.on('reconnect', (attemptNumber) => {
        reconnect.bind(_send)(attemptNumber);
    });
    socket.on('disconnect', (reason) => {
        disconnect.bind(_send)(reason);
    });

    function listenToSocket(socket: SocketIOClient.Socket) {
        Object.keys(receive).forEach(eventName => {
            socket.on(eventName, data => {
                receive[eventName].bind(_send)(data);
            });
        });
    }
    listenToSocket(socket);

    socket.open();

    return client as any;
}

