import { ClientTemplate } from '@irysius/anguli-components/Client';
import { IReceive, ISend } from './ExpectedClientTypes';
export let TestClient: ClientTemplate<IReceive, ISend> = {
    connect: function () {

    },
    reconnect: function (attemptNumber: number) {

    },
    receive: {
        timestamp: function (payload: number) {

        }
    },
    disconnect: function (reason: string) {

    }
}


import * as io from 'socket.io-client';


let socket = io('/admin', { autoConnect: false });

socket.on('connect', () => {

});
socket.open();
