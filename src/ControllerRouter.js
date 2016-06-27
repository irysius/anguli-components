var _ = require('lodash');
var fs = require('fs');
var PATH = require('path');
var Logger = require('@irysius/utils').Logger;

function ControllerRouter({ express, logger = null }) {
	logger = logger || Logger.silent();
	if (!Logger.isLoggerValid(logger)) {
		throw new Error('ControllerRouter is passed an invalid logger.');
	}
	
	function createRouter(controller) {
		var router = new express.Router();
		if (controller.options && _.isFunction(controller.options)) {
			logger.warn('ControllerRouter expects controller.options to be reserved for an object storing metadata. It is a function instead.');
		}
		var validVerbs = ['get', 'post', 'put', 'patch', 'delete'];
		Object.keys(controller).forEach(k => {
			// We reserve controller.options for things like renaming the route.
			var key = k.toLowerCase().trim();
			if (key === 'options') { return; }
			var method, route; 
			if (key.indexOf(' ') !== -1) {
				[method, route] = key.split(' ').map(x => x.trim());
			} else if (key === 'index') {
				method = 'get'; route = '/';
			} else if (validVerbs.indexOf(key) === -1) {
				method = 'get'; route = key;
			} else {
				method = key; route = '/';
			}

			if (!_.startsWith(route, '/')) { route = '/' + route };
			if (validVerbs.indexOf(method) !== -1 && _.isFunction(controller[k])) {
				router[method](route, controller[k]);	
			}
		});
		return router;
	}
	
	function setupControllers(app, rootFolder) {
		logger.info('ControllerRouter initializing.');
		var path = PATH.resolve(rootFolder, 'controllers');
		var controllers = fs.readdirSync(path)
			.filter(x => x.endsWith('Controller.js'))
			.map(x => x.replace(/\.js$/, ''));

		controllers.forEach(name => {
			var controller;
			let path = PATH.resolve(rootFolder, 'controllers', name);
			try {
				controller = require(path);
			} catch (error) { 
				logger.error(`Error loading controller by name: ${name}`);
				logger.error(error);
				return; 
			}
			if (typeof controller === 'object') {
				let path = name.toLowerCase().replace(/controller$/, '');
				if (controller.options && controller.options.name) {
					path = controller.options.name.toLowerCase();
				}
				if (path[0] !== '/') { path = '/' + path; }
				
				var router = createRouter(controller);
				app.use(path, router);
			}
		});
		logger.info('ControllerRouter initialized.');
	}
	
	return {
		setup: setupControllers	
	};
}

module.exports = ControllerRouter;

