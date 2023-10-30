import { CirqlStatefulOptions } from "../types";
import { CirqlLegacyBaseImpl } from "./base";
import { openConnection } from "../connection";
import { SurrealHandle } from "../connection/types";
import { CirqlCloseEvent, CirqlErrorEvent } from "../events";
import { AuthenticationDetails, RegistrationDetails } from "../types";

type RequiredOptions = Required<Omit<CirqlStatefulOptions, 'credentials'>> & Pick<CirqlStatefulOptions, 'credentials'>;

/**
 * **THIS CLASS IS DEPRECATED**\
 * Please use the new surrealdb.js based implementation
 * 
 * A stateful connection to a Surreal database. This class provides full access
 * to all of Cirql's ORM functionality.
 * 
 * Events:
 * - connect: The connection is being established
 * - open: The connection was successfully opened 
 * - close: The connection was closed
 * - error: An error occured in the connection
 */
export class LegacyCirqlStateful extends CirqlLegacyBaseImpl {

	readonly options: RequiredOptions;
	
	#surreal: SurrealHandle|null = null;
	#isPending: boolean = false;
	#isConnected: boolean = false;
	#retries: number = 0;
	#retryTask: any|undefined;

	constructor(options: CirqlStatefulOptions) {
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
			queryTimeout: 5_000,
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
			credentials: this.options.credentials,
			queryTimeout: this.options.queryTimeout,
			onConnect: () => {
				clearTimeout(this.#retryTask);

				this.#retries = 0;
				this.#retryTask = undefined;
				this.#isConnected = true;
				this.#isPending = false;
				this.dispatchEvent(new Event('open'));
			},
			onDisconnect: (error, reason) => {
				this.#isConnected = false;
				this.#isPending = false;
				this.dispatchEvent(new CirqlCloseEvent(error, reason));

				const { retryCount, retryDelay } = this.options;

				if (retryCount < 0 || (retryCount > 0 && this.#retries < retryCount)) {
					this.#retries++;
					this.#retryTask = setTimeout(() => this.connect(), retryDelay);
				}
			},
			onError: (error) => {
				this.dispatchEvent(new CirqlErrorEvent(error));
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
	 * Returns a promise which resolves when the connection is ready
	 * 
	 * @returns A promise
	 */
	ready() {
		if (this.isConnected) {
			return Promise.resolve();
		}

		return new Promise<void>((resolve, reject) => {
			this.addEventListener('open', () => resolve(), { once: true });
			this.addEventListener('error', (e) => reject(e), { once: true });
		});
	}

	signIn(credentials: AuthenticationDetails): Promise<string | undefined> {
		return this.handle!.signIn(credentials);
	}

	signUp(registration: RegistrationDetails): Promise<string | undefined> {
		return this.handle!.signUp(registration);
	}

	signOut(): Promise<void> {
		return this.handle!.signOut();
	}

}