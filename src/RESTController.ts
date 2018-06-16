import * as _ from 'lodash';
import { controller as errorHandler } from './ErrorHandler';
import * as express from 'express';

// Note: Definitely relies on Waterline.

function populateModel(promise, fields?: string[]|string) {
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

export interface IRESTControllerOptions {
    notifyHub?: boolean;
    context?: {
        Hubs: any;
    };
    softDeleteField?: string;
}
export class RESTController {
    constructor(model, modelName: string, options?: IRESTControllerOptions) {
        modelName = modelName.toLowerCase();
        this.Model = model;
        this.options = options || {};

        let hubSend;
        function notifyHub(action: string, value) {
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
        this.notifyHub = notifyHub.bind(this);
    }

    Model;
    options: IRESTControllerOptions;
    notifyHub: (action: string, value) => void;

    get(req: express.Request, res: express.Response) {
        let fields = req.query.populate;
        delete req.query.populate;
        populateModel(this.Model.find(req.query), fields).then(items => {
            res.json(items);
        }).catch(errorHandler(req, res));
    }
    ['get /:id(\\d+)'](req: express.Request, res: express.Response) {
        delete req.query.id;
        let fields = req.query.populate;
        delete req.query.populate;
        let criteria = _.merge({ id: req.params.id }, req.query);
        populateModel(this.Model.findOne(criteria), fields).then(item => {
            if (!item) { 
                res.status(404).json({ error: 'Not found' }); 
            } else { 
                res.json(item); 
            }
        }).catch(errorHandler(req, res));
    }
    post(req: express.Request, res: express.Response) {
        delete req.body.id;
        this.Model.create(req.body).then(item => {
            res.json(item);
            this.notifyHub('created', item);
        }).catch(errorHandler(req, res));
    }
    ['put /:id(\\d+)'](req: express.Request, res: express.Response) {
        delete req.body.id;
        let fields = req.query.populate;
        delete req.query.populate;
        populateModel(this.Model.update(req.params.id, req.body), fields).then(items => {
            if (items.length === 0) {
                res.status(404).json({ error: 'Not found.' });
            } else {
                res.json(items[0]);
                this.notifyHub('updated', items[0]);
            }
        }).catch(errorHandler(req, res));
    };
    ['delete /:id(\\d+)'](req: express.Request, res: express.Response) {
        if (this.options.softDeleteField) {
            let update = {};
            update[this.options.softDeleteField] = true;
            this.Model.update(req.params.id, update).then(items => {
                res.json({ message: 'OK' });
                this.notifyHub('removed', req.params.id);
            }).catch(errorHandler(req, res));	
        } else {
            this.Model.destroy(req.params.id).then(() => {
                res.json({ message: 'OK' });
                this.notifyHub('removed', req.params.id);
            }).catch(errorHandler(req, res));	
        }
    };
}