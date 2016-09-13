var _ = require('lodash');
var fs = require('fs');
var PATH = require('path');
var Logger = require('@irysius/utils').Logger;
var Hub = require('./Hub');

function HubRouter({ io, logger = null }) {
	logger = logger || Logger.silent();
	if (!Logger.isLoggerValid(logger)) {
		throw new Error('HubRouter is passed an invalid logger.');
	}
	
	function setupHubs(rootFolder) {
		logger.info('HubRouter initializing.');
		var path = PATH.resolve(rootFolder, 'hubs');

		// Walk through hubs
		var hubs = [];
		try {
			hubs = fs.readdirSync(path)
				.filter(x => x.endsWith('Hub.js'))
				.map(x => x.replace(/\.js$/, ''));
		} catch (e) { /* Empty Catch */ }

		var result = {};
		hubs.map(name => {
			var hub, _name;
			let path = PATH.resolve(rootFolder, 'hubs', name);
			// Try to load module, and cast into Hub object.
			try {
				hub = Hub(require(path), name, io);
			} catch (error) {
				logger.error(`Error loading hub by name: ${name}`); 
				logger.error(error);
				return null;
			}
			
			if (typeof hub === 'object') {
				_name = name.toLowerCase().replace(/hub$/, '');
				if (hub.options && hub.options.name) {
					_name = hub.options.name.toLowerCase();
				}
				let path = _name;
				if (path[0] !== '/') { path = '/' + path; }
				// Establish namespace and attach to connection event.
				var socketNamespace = io.of(path);
				socketNamespace.on('connection', hub.connect);
			}
			return { key: _name, value: hub };
		}).filter(x => x).forEach(x => {
			// return processed hash of hubs.
			result[x.key] = x.value;
		});
		logger.info('HubRouter initialized.');
		return result;
	}
	
	return {
		setup: setupHubs	
	};
}

module.exports = HubRouter;