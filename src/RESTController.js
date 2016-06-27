var _ = require('lodash');
var h = require('./Helper');

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
		// options: { softDeleteField: String }
		this.options = options || {};
		this.get = (req, res) => {
			var fields = req.query.populate;
			delete req.query.populate;
			populateModel(this.Model.find(req.query), fields).then(items => {
				res.json(items);
			}).catch(h.errorHandler(req, res));
		};
		this['get /:id(\\d+)'] = (req, res) => {
			delete req.query.id;
			var fields = req.query.populate;
			delete req.query.populate;
			var criteria = _.merge({ id: req.params.id }, req.query);
			populateModel(this.Model.findOne(criteria), fields).then(item => {
				if (!item) { res.status(404).json({ error: 'Not found.' }); }
				else { res.json(item); }
			}).catch(h.errorHandler(req, res));
		};
		this.post = (req, res) => {
			delete req.body.id;
			this.Model.create(req.body).then(item => {
				res.json(item);
			}).catch(h.errorHandler(req, res));
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
				}
			}).catch(h.errorHandler(req, res));
		};
		this['delete /:id(\\d+)'] = (req, res) => {
			if (this.options.softDeleteField) {
				let update = {};
				update[this.options.softDeleteField] = true;
				this.Model.update(req.params.id, update).then(items => {
					res.json({ message: 'OK' });
				}).catch(h.errorHandler(req, res));	
			} else {
				this.Model.destroy(req.params.id).then(() => {
					res.json({ message: 'OK' });
				}).catch(h.errorHandler(req, res));	
			}
		};
	}
}

module.exports = RESTController;