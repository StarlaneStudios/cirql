import { CirqlStatelessOptions, Params } from "../types";
import { CirqlLegacyBaseImpl } from "./base";
import { CirqlError } from "../errors";
import { AuthenticationDetails, RegistrationDetails } from "../types";

type RequiredOptions = Required<Omit<CirqlStatelessOptions, 'credentials'>> & Pick<CirqlStatelessOptions, 'credentials'>;

/**
 * **THIS CLASS IS DEPRECATED**\
 * Please use the new surrealdb.js based implementation
 * 
 * A stateless class used to send one-off queries to a Surreal database.
 * This class provides full access to all of Cirql's ORM functionality.
 */
export class LegacyCirqlStateless extends CirqlLegacyBaseImpl {

	readonly options: RequiredOptions;

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

	signIn(_credentials: AuthenticationDetails): Promise<string> {
		throw new Error('Stateless queries do not support authentication yet');
	}

	signUp(_registration: RegistrationDetails): Promise<string> {
		throw new Error('Stateless queries do not support authentication yet');
	}

	signOut(): Promise<void> {
		throw new Error('Stateless queries do not support authentication yet');
	}

	async #executeQuery(query: string, params: Params) {
		const { endpoint, namespace, database } = this.options.connection;
		const { user, pass, DB, NS, SC, token } = this.options.credentials as any;

		const search = new URLSearchParams();
		const url = new URL('sql', endpoint);

		if (!user && !pass && !token) {
			throw new CirqlError('Missing username & password or token', 'invalid_request');
		}

		const authString = token
			? `Bearer ${token}`
			: `Basic ${btoa(`${user}:${pass}`)}`;

		const headers: Record<string, string> = {
			'User-Agent': 'Cirql',
			'Authorization': authString,
			'Accept': 'application/json'
		};

		// NOTE I have no idea what I'm supposed to do with the credentials DB and NS, since
		// in the WebSocket protocol they are seperate from the USE-related database and namespace (I think).

		if (NS || namespace) {
			headers['NS'] = NS || namespace;
		}

		if (DB || database) {
			headers['DB'] = DB || database;
		}

		if (SC) {
			headers['SC'] = SC;
		}

		Object.entries(params).forEach(([key, value]) => {
			search.set(key, value);
		});

		const result = await fetch(`${url}?${search}`, {
			method: 'POST',
			headers: headers,
			body: query
		}).then(res => res.json());

		return result;
	}
	
}