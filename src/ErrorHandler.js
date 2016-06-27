var _ = require('lodash');
function errorHandler(req, res) {
	return function handleError(error) {
		if (_.isArray(error) && error.length === 2) {
			if (_.isString(error[1])) {
				res.status(error[0]).json({ error: error[1] });	
			} else {
				res.status(error[0]).json(error[1]);
			}		
		} else if (error.ValidationError) {
			res.status(400).json(error.ValidationError);
		} else {
			res.status(500).json({ error: error.message });
		}
	};
}

function socketErrorHandler(done) {
	return function handleError(error) {
		var message;
		if (_.isArray(error) && error.length === 2) {
			message = error[1];
		} else if (error.ValidationError) {
			message = error.ValidationError;
		} else {
			message = error.message;
		}
		done && done({ error: message });
	};
}

module.exports = {
	controller: errorHandler,
	socket: socketErrorHandler	
};