import WebSocket from 'isomorphic-ws';
import { nextId } from '../helpers';
import { SurrealOptions, SurrealHandle, Operation } from './types';

/**
 * Create a new Surreal connection
 * 
 * @param options The connection options
 * @returns A handle to the connection
 */
export function openConnection(options: SurrealOptions): SurrealHandle {
	const endpoint = new URL('rpc', options.connection.endpoint.replace('http', 'ws'));
	const pinger = setInterval(() => message('ping'), 30_000);
	const socket = new WebSocket(endpoint);
	const requestMap = new Map<string, Operation>();

	let isClosed = false;

	/**
	 * Send a message to the database
	 */
	const message = (method: string, params: any[] = []) => {
		const id = nextId();

		return new Promise((success, reject) => {
			requestMap.set(id, [success, reject]);

			socket.send(JSON.stringify({
				id,
				method,
				params
			}));

			setTimeout(() => {
				if (requestMap.delete(id)) {
					reject(new Error('Request timed out'));
				}
			}, 5_000);
		});
	}

	/**
	 * Clean up any resources
	 */
	const cleanUp = () => {
		clearInterval(pinger);
		options.onDisconnect?.();
	}

	/**
	 * Forcefully close the connection
	 */
	const close = () => {
		isClosed = true;
		socket.close();
		cleanUp();
	};

	/**
	 * Send a general query to the database
	 */
	const query = async (query: string, params: Record<string, any>) => {
		return message('query', params ? [query, params] : [query]);
	};

	socket.addEventListener('open', async () => {
		const { username, password, namespace, database } = options.connection;

		options.onConnect?.();
 
		try {
			await message('signin', [{
				user: username,
				pass: password
			}]);
		} catch {
			close();
			return;
		}

		if (namespace && database) {
			message('use', [namespace, database]);
		}
	});

	socket.addEventListener('close', (event) => {
		if (!isClosed) {
			cleanUp();
		}

		if (event.code !== 1000) {
			options.onError?.(event.code, event.reason);
		}
	});

	socket.addEventListener('message', (event) => {
		const { id, result, method, error } = JSON.parse(event.data as string);

		if (method === 'notify') {
			return;
		}
		
		if (!requestMap.has(id)) {
			console.warn('No callback for message', event.data);
		} else {
			const [resolve, reject] = requestMap.get(id)!;

			requestMap.delete(id);

			if (error) {
				reject(error);
			} else {
				resolve(result);
			}
		}
	});

	return {
		close,
		query,
	}
}