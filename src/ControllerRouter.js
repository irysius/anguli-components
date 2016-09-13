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

		// Walk through controllers
		var controllers = [];
		try {
			controllers = fs.readdirSync(path)
				.filter(x => x.endsWith('Controller.js'))
				.map(x => x.replace(/\.js$/, ''))
		} catch (e) { /* Empty Catch */ }

		var result = {};
		controllers.map(name => {
			var controller, router, _name;
			let path = PATH.resolve(rootFolder, 'controllers', name);
			// Try to load module.
			try {
				controller = require(path);
			} catch (error) { 
				logger.error(`Error loading controller by name: ${name}`);
				logger.error(error);
				return null; 
			}
			if (typeof controller === 'object') {
				_name = name.toLowerCase().replace(/controller$/, '');
				if (controller.options && controller.options.name) {
					_name = controller.options.name.toLowerCase();
				}
				let path = _name;
				if (path[0] !== '/') { path = '/' + path; }
				// Create router and make express use it as middleware.
				router = createRouter(controller);
				app.use(path, router);
			}
			return { key: _name, value: router };
		}).filter(x => x).forEach(x => {
			// return processed hash of routers.
			result[x.key] = x.value;
		});
		logger.info('ControllerRouter initialized.');
		return result;
	}
	
	return {
		setup: setupControllers	
	};
}

module.exports = ControllerRouter;

