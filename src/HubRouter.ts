import * as fs from 'fs';
import * as PATH from 'path';
import { Logger, ILogger } from '@irysius/utils';
import { Hub } from './Hub';
import { IHub, IMap } from './helpers';
import * as io from 'socket.io';

export interface IHubRouterOptions {
    io: io.Server;
    logger?: ILogger;
}
export function HubRouter(options: IHubRouterOptions) {
    let { 
        io, 
        logger = null
    } = options;
	logger = logger || Logger.silent();
	if (!Logger.isLoggerValid(logger)) {
		throw new Error('HubRouter is passed an invalid logger.');
	}
	
	function setupHubs(rootFolder: string) {
		logger.info('HubRouter initializing.');
		let path = PATH.resolve(rootFolder, 'hubs');

		// Walk through hubs
		let hubs: string[] = [];
		try {
			hubs = fs.readdirSync(path)
				.filter(x => x.endsWith('Hub.js'))
				.map(x => x.replace(/\.js$/, ''));
		} catch (e) { /* Empty Catch */ }

		let result: IMap<IHub> = {};
		hubs.map(name => {
			let hub, _name: string;
			let path = PATH.resolve(rootFolder, 'hubs', name);
			// Try to load module, and cast into Hub object.
			try {
				// TODO: Deal with the use of defaults
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
                
				let socketNamespace = io.of(path);
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

export default HubRouter;