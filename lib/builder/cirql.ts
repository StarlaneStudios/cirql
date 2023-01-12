import { CirqlOptions, CountQueryOptions, CreateQueryOptions, DeleteQueryOptions, RelateQueryOptions, SelectQueryOptions, SimpleQueryOptions, UpdateQueryOptions } from "./types";
import { SurrealHandle } from "../connection/types";
import { openConnection } from "../connection";
import { CirqlQuery } from "./query";
import { ZodTypeAny } from 'zod';

/**
 * A self-contained SurrealDB database connection and query builder instance.
 * You may connect and disconnect from the database as many times as you
 * want.
 * 
 * Events:
 * - connect: The connection is being established
 * - open: The connection was successfully opened 
 * - close: The connection was closed
 * - error: An error occured in the connection
 */
export class Cirql extends EventTarget {

	readonly options: Required<CirqlOptions>;
	
	#surreal: SurrealHandle|null = null;
	#isPending: boolean = false;
	#isConnected: boolean = false;
	#retries: number = 0;
	#retryTask: any|undefined;

	constructor(options: CirqlOptions) {
		super();

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

	/**
	 * Create a new empty query instance. This is useful for chaining multiple
	 * queries together without having to specify an initial query.
	 * 
	 * @returns Cirql query builder
	 */
	prepare() {
		return new CirqlQuery(this, [] as const);
	}
	
	/**
	 * Execute a raw query with support for parameters and return the result
	 * 
	 * @param options The query options
	 * @returns The query result
	 */
	query<R extends ZodTypeAny>(options: SimpleQueryOptions<R>) {
		return this.prepare().query(options).single();
	}

	/**
	 * Select multiple records with support for parameters and return the result
	 * 
	 * @param options The query options
	 * @returns The query result
	 */
	selectMany<R extends ZodTypeAny>(options: SelectQueryOptions<R>) {
		return this.prepare().selectMany(options).single();
	}

	/**
	 * Select a single record with support for parameters and return the result
	 * 
	 * @param options The query options
	 * @returns The query result
	 */
	selectOne<R extends ZodTypeAny>(options: SelectQueryOptions<R>) {
		return this.prepare().selectOne(options).single();
	}

	/**
	 * Create a new record from the given data and return the result.
	 * You can use the raw() function to insert a raw value into the query.
	 * 
	 * @param options The query options
	 * @returns The query result
	 */
	create<R extends ZodTypeAny>(options: CreateQueryOptions<R>) {
		return this.prepare().create(options).single();
	}

	/**
	 * Update one or more records with the given data and return the result.
	 * You can use the raw() function to insert a raw value into the query.
	 * 
	 * @param options The query options
	 * @returns The query result
	 */
	update<R extends ZodTypeAny>(options: UpdateQueryOptions<R>) {
		return this.prepare().update(options).single();
	}

	/**
	 * Remove a single record by its unique id
	 * 
	 * @param options The query options
	 */
	delete(options: DeleteQueryOptions) {
		return this.prepare().delete(options).single();
	}

	/**
	 * Return the amount of records that match the given
	 * query.
	 * 
	 * @param options The query options
	 * @returns The query result
	 */
	count(options: CountQueryOptions) {
		return this.prepare().count(options).single();
	}
	
	/**
	 * Relate a record to another record over an edge.
	 * 
	 * @param options The query options
	 */
	relate(options: RelateQueryOptions) {
		return this.prepare().relate(options).single();
	}

}