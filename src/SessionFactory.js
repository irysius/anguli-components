var express_session = require('express-session');
var RedisStore = require('connect-redis')(express_session);

function createSessionMiddleware({ sessionsecret = 'keyboard cat', redis = null } = {}) {
	var sessionOptions = {
		secret: sessionsecret,
		resave: true,
		saveUninitialized: false
	};
	if (redis) {
		sessionOptions.store = new RedisStore(redis);
	}
	var session = express_session(sessionOptions);
	return session;
}

module.exports = { create: createSessionMiddleware };