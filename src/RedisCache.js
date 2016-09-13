function redisResult(client, operation, ...parameters) {
	return new Promise((resolve, reject) => {
		parameters.push((err, result) => {
			err ? reject(err) : resolve(result);
		});
		client[operation].apply(client, parameters);
	});
}

// RedisClient, any => String, any => Object|Promise<Object>
function RedisCache(client, keyer, fetcher) {
	if (!client) { throw new Error('client is a required parameter for RedisClient'); }
	
	function get(id) {
		// any => Promise<Object> 
		var key = keyer(id);
		return redisResult(client, 'get', key).then(cached => {
			// Will throw if redis contains an invalid json string.
			var value = JSON.parse(cached);
			if (!cached) {
				return Promise.resolve(fetcher(id)).then(newValue => {
					return redisResult(client, 'set', key, JSON.stringify(newValue)).then(() => {
						return newValue;
					});
				});
			}

			return value;
		});
	}
	function refresh(id) {
		// any => Promise<Object>
		var key = keyer(id);
		return Promise.resolve(fetcher(id)).then(newValue => {
			return redisResult(client, 'set', key, JSON.stringify(newValue)).then(() => {
				return newValue;
			});
		});
	}
	function clear(id) {
		// any => Promise<Boolean>
		var key = keyer(id);
		return redisResult(client, 'del', key);
	}

	return {
		get: get,
		refresh: refresh,
		clear: clear
	};
}

module.exports = RedisCache;