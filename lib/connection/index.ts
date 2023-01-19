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
	const cleanUp = (code: number, reason: string) => {
		clearInterval(pinger);
		options.onDisconnect?.(code, reason);
	}

	/**
	 * Forcefully close the connection
	 */
	const close = () => {
		isClosed = true;
		socket.close();
		cleanUp(-1, 'connection terminated');
	};

	/**
	 * Send a general query to the database
	 */
	const query = async (query: string, params: Record<string, any>) => {
		return message('query', params ? [query, params] : [query]);
	};

	socket.addEventListener('open', async () => {
		const { namespace, database } = options.connection;
		
		try {
			if ('token' in options.credentials) {
				await message('authenticate', [options.credentials.token]);
			} else {
				await message('signin', [options.credentials]);
			}
		} catch {
			close();
			return;
		}
		
		if (namespace && database) {
			message('use', [namespace, database]);
		}

		options.onConnect?.();
	});

	socket.addEventListener('close', (event) => {
		if (!isClosed) {
			cleanUp(event.code, event.reason);
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

	socket.addEventListener('error', (e) => {
		options.onError?.(e.error);
	});

	return {
		close,
		query,
	}
}