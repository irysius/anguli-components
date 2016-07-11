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

		hubs.forEach(name => {
			var hub;
			let path = PATH.resolve(rootFolder, 'hubs', name);
			try {
				hub = Hub(require(path), name, io);
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
				socketNamespace.on('connection', hub.connect);
			}
		});
		logger.info('HubRouter initialized.');
	}
	
	return {
		setup: setupHubs	
	};
}

module.exports = HubRouter;