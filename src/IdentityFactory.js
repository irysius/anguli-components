var _ = require('lodash');

function isValidUserLocator(userLocator) {
	return (_.isFunction(userLocator));
}

function createIdentityMiddleware({ userLocator } = {}) {
	// We expect userLocator to have the following signature:
	// (id: Number) => Promise<User>
	if (!isValidUserLocator(userLocator)) {
		throw new Error('IdentityFactory.create is passed an invalid userLocator.');
	}
	
	return function (req, res, next) {
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

module.exports = { create: createIdentityMiddleware };