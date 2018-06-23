import * as io from 'socket.io-client';


export interface ClientTemplate<R = any, S = any> {
    connect(this: ClientSend<S>): void;
    reconnect(this: ClientSend<S>, attemptNumber: number): void;
    receive: ClientReceive<R, S>;
    disconnect(reason: string): void;
}
export interface Client<R = any, S = any> extends ClientTemplate<R, S> {
    send: ClientSend<S>;
}
export type ClientSend<S = any> = {
    [P in keyof S]: (payload: S[P]) => void;
}
export type ClientReceive<R = any, S = any> = {
    [P in keyof R]: (this: ClientSend<S>, data: R[P]) => void;
}

export function augmentClient<R, S>(client: ClientTemplate<R, S>): Client<R, S> {
    // Read out ISend and IReceive, and use it to create a Client file.
    // Need to determine how to reconcilate automatic updates.
    //     merge? temp file to merge back in?
    return client as any;
}

