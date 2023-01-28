import WebSocket from 'isomorphic-ws';
import { CirqlAuthenticationError } from '../errors';
import { nextId } from '../helpers';
import { AuthenticationDetails, RegistrationDetails } from '../types';
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

	/**
	 * Sign in with the provided credentials
	 * 
	 * @param credentials The credentials to sign in with
	 * @returns The token used for the session
	 */
	const signIn = async (credentials: AuthenticationDetails): Promise<string> => {
		try {
			if ('token' in credentials) {
				await message('authenticate', [credentials.token]);

				return credentials.token as string;
			} else {
				return await message('signin', [credentials]) as string;
			}
		} catch(err: any) {
			throw new CirqlAuthenticationError('Authentication failed: ' + (err.message || 'unknown error'));
		}
	};

	/**
	 * Sign up with the provided credentials
	 * 
	 * @param registration The credentials to sign up with
	 * @returns The token used for the session
	 */
	const signUp = async (registration: RegistrationDetails): Promise<string> => {
		try {
			return await message('signup', [registration]) as string;
		} catch(err: any) {
			throw new CirqlAuthenticationError('Registration failed: ' + (err.message || 'unknown error'));
		}
	};

	/**
	 * Sign out of the current session
	 */
	const signOut = async (): Promise<void> => {
		try {
			await message('invalidate');
		} catch(err: any) {
			throw new CirqlAuthenticationError('Sign out failed: ' + (err.message || 'unknown error'));
		}
	};

	socket.addEventListener('open', async () => {
		const { namespace, database } = options.connection;
		
		if (options.credentials) {
			signIn(options.credentials);
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
		signIn,
		signUp,
		signOut
	}
}