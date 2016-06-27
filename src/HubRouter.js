var _ = require('lodash');
var fs = require('fs');
var PATH = require('path');
var Logger = require('@irysius/utils').Logger;

function HubRouter({ io, logger = null }) {
	logger = logger || Logger.silent();
	if (!Logger.isLoggerValid(logger)) {
		throw new Error('HubRouter is passed an invalid logger.');
	}
	
	function setupHubs(rootFolder) {
		logger.info('HubRouter initializing.');
		var path = PATH.resolve(rootFolder, '/hubs');
		var hubs = fs.readdirSync(path)
			.filter(x => x.endsWith('Hub.js'))
			.map(x => x.replace(/\.js$/, ''));

		hubs.forEach(name => {
			var hub;
			let path = PATH.resolve(rootFolder, 'hubs', name);
			try {
				hub = require(path);
			} catch (error) {
				logger.error(`Error loading hub by name: ${name}`); 
				logger.error(error);
				return;
			}
			
			if (typeof hub === 'object') {
				let path = name.toLowerCase().replace(/hub$/, '');
				if (hub.options && hub.options.name) {
					path = hub.options.name.toLowerCase();
				}
				if (path[0] !== '/') { path = '/' + path; }
				var socketNamespace = io.of(path);
				socketNamespace.on('connection', hub.onconnect);
			}
		});
		logger.info('HubRouter initialized.');
	}
	
	return {
		setup: setupHubs	
	};
}

module.exports = HubRouter;