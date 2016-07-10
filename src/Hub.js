function Hub(hub, name, options = {}) {
	var socket;
	Object.defineProperty(hub, 'socket', {
		get: () => {
			if (!socket) { throw new Error(`${name}'s socket not initialized`); }
			return socket;
		}
	});
	hub.connect = (_socket) => {
		return Promise.resolve().then(() => {
			return hub.connect(_socket);
		}).then(() => {
			socket = _socket;
			return initialize(socket);
		});
	};
 
	function initialize(socket) {
		Object.keys(hub.receive).forEach(k => {
			hub.receive[k] = hub.receive[k].bind(hub);
			socket.on(k, hub.receive[k]);
		});
		Object.keys(hub.send).forEach(k => {
			hub.send[k] = hub.send[k].bind(hub);
		});
		socket.on('disconnect', () => {
			Promise.resolve(() => {
				return hub.disconnect(socket);
			}).catch(() => {
				/* Empty catch */
			}).then(() => {
				socket = null;
			});
		});
	}

	return hub;
}

module.exports = Hub;