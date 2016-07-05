/* globals __dirname */
var _ = require('lodash');
var fs = require('fs');
var PATH = require('path');
var Logger = require('@irysius/utils').Logger;

var defaultAdapters = {
	disk: 'sails-disk'
};
var defaultConnections = {
	primary: { adapter: 'disk' }
};
var defaultDefaults = {
	migrate: 'alter'
};

function Modeller({ Waterline, logger = null }) {
	logger = logger || Logger.silent();
	if (!Logger.isLoggerValid(logger)) {
		throw new Error('Modeller is passed an invalid logger.');
	}
	
	var orm = new Waterline();
	var _models = null;
	function initialize(options) {
		options = options || {};
		if (!options.adapters) { options.adapters = defaultAdapters; }
		Object.keys(options.adapters).forEach(key => {
			var adapterName;
			try {
				adapterName = options.adapters[key];
				options.adapters[key] = require(adapterName);
			} catch (e) {
				logger.error(`Error loading Waterline adapter: ${adapterName}`);
				logger.error(e);
			}
		});

		if (!options.connections) { options.connections = defaultConnections; }
		if (!options.defaults) { options.defaults = defaultDefaults; }
		
		return new Promise((resolve, reject) => {
			orm.initialize(options, function (error, models) {
				if (error) { reject(error); }
				else { resolve(models); }
			});	
		}).then(function (models) {
			logger.info('Waterline models initialized.');
			_models = models;
			return models;
		});
	}
	
	function setup(modelFolder) {
		// Walk through models
		var files = [];
		try {
			files = fs.readdirSync(modelFolder)
				.filter(x => x.endsWith('.js'))
				.map(x => x.replace(/\.js$/, ''));
		} catch (e) { /* Empty Catch */ }

		files.forEach(file => {
			let modelPath = PATH.resolve(PATH.join(modelFolder, file));
			var model = require(modelPath);
			model = _.merge({ 
				identity: file.toLowerCase(),
				connection: 'primary'
			}, model);
			var collection = Waterline.Collection.extend(model);
			orm.loadCollection(collection);
		});
	}
	
	var proxy = {
		initialize: function (config, modelFolder) {
			setup(modelFolder);
			return initialize(config);
		}
	};
	
	Object.defineProperty(proxy, 'models', {
		enumerable: true,
		get: function () {
			if (!_models) { throw new Error('Models not initialized.'); }
			return _models.collections;
		}
	});
	Object.defineProperty(proxy, 'connections', {
		enumerable: true,
		get: function () {
			if (!_models) { throw new Error('Models not initialized.'); }
			return _models.connections;
		}
	});
	
	return proxy;
}

module.exports = Modeller;