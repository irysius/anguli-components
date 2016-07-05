var _ = require('lodash');
var { IgnoreError, HttpError } = require('@irysius/utils');

function errorHandler(req, res) {
	return function handleError(error) {
		if (error instanceof HttpError) {
			res.status(error.statusCode).json({ error: error.message });
		} else if (error instanceof IgnoreError) {
			res.status(200).json({ message: 'OK' });
		} else {
			res.status(500).json({ error: error.message });
		}
	};
}

function socketErrorHandler(done) {
	return function handleError(error) {
		if (error instanceof IgnoreError) {
			done && done();
		} else {
			done && done({ error: error.message });
		}
	};
}

module.exports = {
	controller: errorHandler,
	socket: socketErrorHandler	
};