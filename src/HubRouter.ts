import * as fs from 'fs';
import * as PATH from 'path';
import { Logger, ILogger } from '@irysius/utils';
import { HubTemplate, augmentHub, HubSend, Hub } from './Hub';
import { IMap, flexibleRequire } from './helpers';
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
		let path = PATH.resolve(rootFolder, 'hubs');
		logger.info(`HubRouter initializing at: ${path}`);

		// Walk through hubs
		let hubs: string[] = [];
		try {
			hubs = fs.readdirSync(path)
				.filter(x => x.endsWith('Hub.js'))
				.map(x => x.replace(/\.js$/, ''));
		} catch (e) { /* Empty Catch */ }

		let result: IMap<Hub> = {};
		hubs.map(name => {
			let rawHub: HubTemplate;
			let path = PATH.resolve(rootFolder, 'hubs', name);
			// Try to load module, and cast into Hub object.
			try {
				rawHub = flexibleRequire<HubTemplate>(path);
				augmentHub(rawHub, io, name); // do not need the return value
			} catch (error) {
				logger.error(`Error loading hub by name: ${name}`); 
				logger.error(error);
				return null;
			}
			
			return { key: name, value: rawHub as Hub };
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