import * as express from 'express';
import * as _ from 'lodash';
import { IExtendedRequest } from './helpers';

function isUserLocator<U>(value): value is UserLocator<U> {
    return typeof value === 'function';
}

export type UserLocator<U> = (id: number) => Promise<U>;
export interface IIdentityFactoryOptions<U> {
    userLocator: UserLocator<U>
}
export function create<U>(options: IIdentityFactoryOptions<U>) {
    let {
        userLocator
    } = options;
	// We expect userLocator to have the following signature:
	// (id: Number) => Promise<User>
	if (!isUserLocator(userLocator)) {
		throw new Error('IdentityFactory.create is passed an invalid userLocator.');
	}
	
	return function (req: IExtendedRequest, res: express.Response, next: express.NextFunction) {
		req.logout = function () {
			delete req.session.userid;
		};
		req.login = function (user) {
			if (_.isNumber(user)) {
				req.session.userid = user;
			} else if (_.has(user, 'id')) {
				req.session.userid = user.id;
			}
		};
		
		userLocator(req.session.userid || -1).then(user => {
			if (user) { req.user = user; }
		}).then(() => {
			next();
		});
	};
}