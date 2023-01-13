import { CirqlOptions, CirqlStatelessOptions, Params } from "./types";
import { SurrealHandle } from "../connection/types";
import { openConnection } from "../connection";
import { CirqlBaseImpl } from "./base";
import { CirqlError } from "../errors";

/**
 * A stateful connection to a Surreal database. This class provides full access
 * to all of Cirql's ORM functionality.
 * 
 * Events:
 * - connect: The connection is being established
 * - open: The connection was successfully opened 
 * - close: The connection was closed
 * - error: An error occured in the connection
 */
export class Cirql extends CirqlBaseImpl {

	readonly options: Required<CirqlOptions>;
	
	#surreal: SurrealHandle|null = null;
	#isPending: boolean = false;
	#isConnected: boolean = false;
	#retries: number = 0;
	#retryTask: any|undefined;

	constructor(options: CirqlOptions) {
		super({
			onQuery: (query, params) => this.handle!.query(query, params),
			onRequest: () => this.isConnected && !!this.handle,
			onLog: (query, params) => {
				if (this.options.logging) {
					this.options.logPrinter(query, params);
				}
			}
		});

		this.options = {
			autoConnect: true,
			logging: false,
			logPrinter: (query) => console.log(query),
			retryCount: 10,
			retryDelay: 2000,
			...options
		};
		
		if (options.autoConnect !== false) {
			this.connect();
		}
	}

	/**
	 * Returns whether the database is connected or not
	 */
	get isConnected() {
		return this.#isConnected && !this.#isPending;
	}

	/**
	 * Returns the underlying Surreal handle
	 */
	get handle() {
		return this.#surreal;
	}

	/**
	 * Manually open a connection to the Surreal database
	 */
	connect() {
		if (this.#isConnected || this.#isPending) {
			return;
		}

		this.dispatchEvent(new Event('connect'));

		this.#isPending = true;
		this.#surreal = openConnection({
			connection: this.options.connection,
			onConnect: () => {
				clearTimeout(this.#retryTask);

				this.#retries = 0;
				this.#retryTask = undefined;
				this.#isConnected = true;
				this.#isPending = false;
				this.dispatchEvent(new Event('open'));
			},
			onDisconnect: () => {
				this.#isConnected = false;
				this.#isPending = false;
				this.dispatchEvent(new Event('close'));

				const { retryCount, retryDelay } = this.options;

				if (retryCount < 0 || (retryCount > 0 && this.#retries < retryCount)) {
					this.#retries++;
					this.#retryTask = setTimeout(() => this.connect(), retryDelay);
				}
			},
			onError: (error) => {
				this.dispatchEvent(new CustomEvent('error', {
					detail: error
				}));
			}
		});
	}

	/**
	 * Terminate the active connection
	 */
	disconnect() {
		if (!this.#isConnected) {
			return;
		}

		this.#surreal?.close();
	}

}
 
/**
 * A stateless class used to send one-off queries to a Surreal database.
 * This class provides full access to all of Cirql's ORM functionality.
 */
export class CirqlStateless extends CirqlBaseImpl {

	readonly options: Required<CirqlStatelessOptions>;

	constructor(options: CirqlStatelessOptions) {
		super({
			onQuery: (query, params) => this.#executeQuery(query, params),
			onRequest: () => true,
			onLog: (query, params) => {
				if (this.options.logging) {
					this.options.logPrinter(query, params);
				}
			}
		});

		this.options = {
			logging: false,
			logPrinter: (query) => console.log(query),
			...options
		};
	}

	async #executeQuery(query: string, params: Params) {
		if (Object.keys(params).length > 0) {
			throw new CirqlError('Stateless queries do not support parameters yet. ', 'invalid_request');
		}

		const { endpoint, username, password, token, namespace, database, scope } = this.options.connection;

		const url = new URL('sql', endpoint);

		if (!username && !password && !token) {
			throw new CirqlError('Missing username & password or token', 'invalid_request');
		}

		const authString = token
			? `Bearer ${token}`
			: `Basic ${btoa(`${username}:${password}`)}`;

		const headers: Record<string, string> = {
			'User-Agent': 'Cirql',
			'Authorization': authString,
			'Accept': 'application/json'
		};

		if (namespace) {
			headers['NS'] = namespace;
		}

		if (database) {
			headers['DB'] = database;
		}

		if (scope) {
			headers['SC'] = scope;
		}

		const result = await fetch(url, {
			method: 'POST',
			headers: headers,
			body: query
		}).then(res => res.json());

		return result;
	}
	
}