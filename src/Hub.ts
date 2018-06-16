import { IHub } from './helpers';
import * as io from 'socket.io';

export function Hub(rawHub: IHub, name: string, io: io.Server) {
    let path = name.toLowerCase().replace(/hub$/, '');
    if (rawHub.options && rawHub.options.name) {
		path = rawHub.options.name.toLowerCase();
	}
    if (path[0] !== '/') { path = '/' + path; }
    
    let _namespace = io.of(path);
    let hub = {
        io: _namespace,
        options: rawHub.options,
        connect: (socket) => {
            rawHub.connect(socket);
            initialize(socket);
        },
        send: {}
    };

    Object.keys(rawHub.send).forEach(k => {
		hub.send[k] = rawHub.send[k].bind(hub);
	});
    
    function initialize(socket) {
        // Re-evaluate the need to have an instance.
		let instance = { 
			io: _namespace,
			socket: socket,
			options: rawHub.options,
			send: {},
			receive: {} 
		};
		Object.keys(rawHub.send).forEach(k => {
			instance.send[k] = rawHub.send[k].bind(instance);
		});
		Object.keys(rawHub.receive).forEach(k => {
			instance.receive[k] = rawHub.receive[k].bind(instance);
			socket.on(k, instance.receive[k]);
		});
		
		socket.on('disconnect', () => {
			rawHub.disconnect(socket);
		});
	}

    return hub;
}