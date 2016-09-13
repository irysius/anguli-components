var _ = require('lodash');
var errorHandler = require('./ErrorHandler').controller;

function populateModel(promise, fields) {
	if (_.isString(fields)) {
		fields = fields.split(',').filter(x => !!x);
	} else if (!_.isArray(fields)) {
		fields = []; // prevent crashes.
	}
	fields.forEach(field => {
		promise = promise.populate(field);
	});
	return promise;
}

class RESTController {
	constructor(model, modelName, options) {
		modelName = modelName.toLowerCase();
		this.Model = model;
		// options: { softDeleteField: String, context: { Hub: Hub }, notifyHub: boolean }
		this.options = options || {};
		var hubSend;
		function notifyHub(action, value) {
			// Only notify hub if context exists and notifyHub is set to true.
			if (!options.notifyHub || !options.context) { return; }
			if (hubSend) {
				hubSend[action](value);
			} else if (options.context && options.context.Hubs &&
				options.context.Hubs[modelName] && options.context.Hubs[modelName].send) 
			{
				hubSend = options.context.Hubs[modelName].send;
				hubSend[action](value);
			}
		}
		this.get = (req, res) => {
			var fields = req.query.populate;
			delete req.query.populate;
			populateModel(this.Model.find(req.query), fields).then(items => {
				res.json(items);
			}).catch(errorHandler(req, res));
		};
		this['get /:id(\\d+)'] = (req, res) => {
			delete req.query.id;
			var fields = req.query.populate;
			delete req.query.populate;
			var criteria = _.merge({ id: req.params.id }, req.query);
			populateModel(this.Model.findOne(criteria), fields).then(item => {
				if (!item) { res.status(404).json({ error: 'Not found.' }); }
				else { res.json(item); }
			}).catch(errorHandler(req, res));
		};
		this.post = (req, res) => {
			delete req.body.id;
			this.Model.create(req.body).then(item => {
				res.json(item);
				notifyHub('created', item);
			}).catch(errorHandler(req, res));
		};
		this['put /:id(\\d+)'] = (req, res) => {
			delete req.body.id;
			var fields = req.query.populate;
			delete req.query.populate;
			populateModel(this.Model.update(req.params.id, req.body), fields).then(items => {
				if (items.length === 0) {
					res.status(404).json({ error: 'Not found.' });
				} else {
					res.json(items[0]);
					notifyHub('updated', items[0]);
				}
			}).catch(errorHandler(req, res));
		};
		this['delete /:id(\\d+)'] = (req, res) => {
			if (this.options.softDeleteField) {
				let update = {};
				update[this.options.softDeleteField] = true;
				this.Model.update(req.params.id, update).then(items => {
					res.json({ message: 'OK' });
					notifyHub('removed', req.params.id);
				}).catch(errorHandler(req, res));	
			} else {
				this.Model.destroy(req.params.id).then(() => {
					res.json({ message: 'OK' });
					notifyHub('removed', req.params.id);
				}).catch(errorHandler(req, res));	
			}
		};
	}
}

module.exports = RESTController;