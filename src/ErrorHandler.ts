import { HttpError, IgnoreError } from '@irysius/utils';
import * as express from 'express';

export function controller(req: express.Request, res: express.Response) {
	return function handleError(error: Error) {
		if (error instanceof HttpError) {
			res.status(error.statusCode).json({ error: error.message });
		} else if (error instanceof IgnoreError) {
			res.status(200).json({ message: 'OK' });
		} else {
			res.status(500).json({ error: error.message });
		}
	};
}

export function socket(done) {
	return function handleError(error: Error) {
		if (error instanceof IgnoreError) {
			done && done();
		} else {
			done && done({ error: error.message });
		}
	};
}