var _ = require('lodash');

function rejectWithJson(message = { error: 'forbidden' }) {
	return function (req, res) {
		res.status(403).json(message);
	};
}
function rejectWithRedirect(path = '/') {
	return function (req, res) {
		res.redirect(path);
	};
}

function authenticate3(controller, actionName, onFail) {
	if (!_.isFunction(onFail)) { onFail = rejectWithJson(); }
	var original = controller[actionName];
	controller[actionName] = function wrapper(req, res) {
		if (!req.user) {
			onFail(req, res);
		} else {
			original(req, res);
		}
	};
}
function authenticate2(controller, onFail) {
	if (!_.isFunction(onFail)) { onFail = rejectWithJson(); }
	Object.keys(controller).forEach(key => {
		if (_.isFunction(controller[key])) {
			authenticate3(controller, key, onFail);
		}
	});
}
function authenticate(controller, b, c) {
	if (!controller) { throw new Error('Cannot extend controller action with authentication without a controller.'); }
	if (!b) { 
		authenticate2(controller);
	} else {
		if (_.isFunction(b)) {
			authenticate2(controller, b);
		} else {
			authenticate3(controller, b, c);
		}
	}
}

// Provide default rejection functions
authenticate.rejectWithJson = rejectWithJson;
authenticate.rejectWithRedirect = rejectWithRedirect;

module.exports = authenticate;