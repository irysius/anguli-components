function Hub(_hub, name, io, options = {}) {
	let path = name.toLowerCase().replace(/hub$/, '');
	if (_hub.options && _hub.options.name) {
		path = _hub.options.name.toLowerCase();
	}
	if (path[0] !== '/') { path = '/' + path; }

	var _namespace = io.of(path);
	var hub = {
		io: _namespace,
		options: _hub.options,
		connect: (_socket) => {
			_hub.connect(_socket);		
			initialize(_socket);
		},
		send: {}
	};

	Object.keys(_hub.send).forEach(k => {
		hub.send[k] = _hub.send[k].bind(hub);
	});
	
	function initialize(socket) {
		var instance = { 
			io: _namespace,
			socket: socket,
			options: _hub.options,
			send: {},
			receive: {} 
		};
		Object.keys(_hub.send).forEach(k => {
			instance.send[k] = _hub.send[k].bind(instance);
		});
		Object.keys(_hub.receive).forEach(k => {
			instance.receive[k] = _hub.receive[k].bind(instance);
			socket.on(k, instance.receive[k]);
		});
		
		socket.on('disconnect', () => {
			_hub.disconnect(socket);
		});
	}

	return hub;
}

module.exports = Hub;