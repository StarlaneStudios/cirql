import { ZodTypeAny } from "zod";
import { Quantity } from "../writer";
import { CirqlError, CirqlParseError, CirqlQueryError } from "../errors";
import { MultiTypeOf, Params, QueryRequest, SoloTypeOf } from "./types";
import { AuthenticationDetails, RegistrationDetails } from "../types";

type SendOptions<T> = { queries: T, prefix: string, suffix: string };

/**
 * The adapter used to connect to Cirql implementations
 */
export interface CirqlAdapter {
	onQuery: (query: string, params: Record<string, any>) => Promise<any>;
	onRequest: () => boolean;
	onLog: (query: string, params: Params) => void;
}

/**
 * The abstract base implemention for Cirql. This class is agnostic to
 * the concept of connections.
 */
export abstract class CirqlBaseImpl extends EventTarget {

	#adapter: CirqlAdapter;

	constructor(config: CirqlAdapter) {
		super();
		this.#adapter = config;
	}

	/**
	 * Execute a single query and return the result
	 * 
	 * @param request The query to execute
	 * @returns The result of the query
	 */
	async execute<T extends QueryRequest<any, ZodTypeAny>>(request: T): Promise<SoloTypeOf<T>> {
		return (await this.batch(request))[0];
	}

	/**
	 * Execute multiple queries and return the results in the same order
	 * 
	 * @param request The queries to execute
	 * @returns The results of the queries, can be destructured
	 */
	async batch<T extends QueryRequest<any, ZodTypeAny>[]>(...request: T): Promise<MultiTypeOf<T>> {
		return this.#sendQuery({
			queries: request,
			prefix: '',
			suffix: ''
		});
	}

	/**
	 * Execute multiple queries and return the results in the same order. Unlike
	 * `batch`, this method will execute the queries in a transaction.
	 * 
	 * @param request The queries to execute
	 * @returns The results of the queries, can be destructured
	 */
	async transaction<T extends QueryRequest<any, ZodTypeAny>[]>(...request: T): Promise<MultiTypeOf<T>> {
		return this.#sendQuery({
			queries: request,
			prefix: 'BEGIN TRANSACTION',
			suffix: 'COMMIT TRANSACTION'
		});
	}

	/**
	 * Sign in with the provided credentials or session token
	 * 
	 * @param credentials The credentials to sign in with
	 * @returns The session token, can be saved and used to sign in again later
	 */
	abstract signIn(credentials: AuthenticationDetails): Promise<string | undefined>;

	/**
	 * Sign up with the provided credentials
	 * 
	 * @param registration The credentials to sign up with
	 * @returns The session token, can be saved and used to sign in again later
	 */
	abstract signUp(registration: RegistrationDetails): Promise<string | undefined>;

	/**
	 * Sign out of the current session
	 */
	abstract signOut(): Promise<void>;

	async #sendQuery<T extends QueryRequest<any, any>[]>(options: SendOptions<T>): Promise<MultiTypeOf<T>> {
		if (!this.#adapter.onRequest()) {
			throw new CirqlError('There is no active connection to the database', 'no_connection');
		}

		if (options.queries.length === 0) {
			return [] as any;
		}

		const params = this.#buildParams(options);
		const request = this.#buildQuery(options);
		const errors: string[] = [];
		const results: any[] = [];

		this.#adapter.onLog(request, params);

		const response = await this.#adapter.onQuery(request, params);

		if (!Array.isArray(response) || response.length !== options.queries.length) {
			throw new CirqlError('The response from the database was invalid', 'invalid_response');
		}

		for (let i = 0; i < response.length; i++) {
			const { status, detail } = response[i];

			if (status !== 'OK') {
				errors.push(`- Query ${i + 1}: ${detail}`);
			}
		}

		if (errors.length > 0) {
			throw new CirqlQueryError(errors);
		}

		for (let i = 0; i < response.length; i++) {
			const { result } = response[i];
			const { query, schema, validate } = options.queries[i];
			const quantity = query._quantity as Quantity;

			if (quantity == 'zero') {
				results.push(undefined);
				continue;
			}

			const transformed: any[] = query._transform?.(result) ?? result;
			const resultList = Array.isArray(transformed) ? transformed : [transformed];

			let values: any[];

			if (validate === false) {
				values = resultList;
			} else {
				const theSchema: ZodTypeAny = query._schema || schema;

				if (!theSchema) {
					throw new CirqlError(`No schema provided for query ${i + 1}`, 'invalid_request');
				}
				
				const parsed = theSchema.array().safeParse(resultList);

				if (!parsed.success) {
					throw new CirqlParseError(`Query ${i + 1} failed to parse`, parsed.error);
				}
				
				values = parsed.data;
			}

			if (quantity == 'one' && values.length === 0) {
				if (query._fallback === undefined) {
					throw new CirqlError(`Query ${i + 1} expected at least one result but got ${values.length}`, 'invalid_response');
				}

				results.push(query._fallback);
				continue;
			}

			if (quantity == 'one' || quantity == 'maybe') {
				if (values.length > 1) {
					throw new CirqlError(`Query ${i + 1} expected at most one result but got ${values.length}`, 'invalid_response');
				}

				results.push(values[0] || null);
				continue;
			}

			results.push(values);
		}

		return results as any;
	}

	#buildQuery(options: SendOptions<QueryRequest<any, any>[]>) {
		let queries = options.queries.map(q => q.query.toQuery());

		if (options.prefix) {
			queries = [options.prefix, ...queries];
		}

		if (options.suffix) {
			queries = [...queries, options.suffix];
		}

		return queries.join(';\n');
	}

	#buildParams(options: SendOptions<QueryRequest<any, any>[]>) {
		const params: Params = {};

		for (const query of options.queries) {
			for (const [name, value] of Object.entries(query.params || {})) {
				if (name in params) {
					throw new CirqlError(`The parameter "${name}" was defined multiple times`, 'invalid_query');
				}

				params[name] = value;
			}
		}

		return params;
	}

}