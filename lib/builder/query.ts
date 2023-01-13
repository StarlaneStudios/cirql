import { SimpleQueryOptions, SelectQueryOptions, CreateQueryOptions, UpdateQueryOptions, DeleteQueryOptions, CountQueryOptions, RelateQueryOptions, Params, Query, Result, SingleResult } from "./types";
import { nextId, parseQuery, table, thing } from "../helpers";
import { buildFieldMap } from "./fields";
import { z, ZodTypeAny } from 'zod';
import { CirqlError, CirqlParseError } from "../errors";
import { select, SelectQueryWriter } from "../writer/select";
import { Raw } from "../raw";
import { CirqlAdapter } from "./base";

/**
 * The main Cirql query builder class on which all queries are built. You can
 * append multiple queries and execute these as transaction.
 */
export class CirqlQuery<T extends readonly Query<ZodTypeAny>[]> {

	#adapter: CirqlAdapter;
	#params: Record<string, any>;
	#queries: T;

	#queryPrefix?: string;
	#querySuffix?: string;

	constructor(previous: CirqlAdapter, queries: T, params?: Record<string, any>) {
		this.#adapter = previous;
		this.#queries = queries;
		this.#params = params || {};
	}

	#push<R extends ZodTypeAny>(query: Query<R>, params: Params) {
		for (const param of Object.keys(params)) {
			if (this.#params[param]) {
				throw new Error(`Duplicate parameter name: ${param}`);
			}
		}

		return new CirqlQuery(
			this.#adapter,
			[...this.#queries, query] as const,
			{...this.#params, ...params}
		);
	}

	/**
	 * Execute a raw query with support for parameters
	 * 
	 * @param options The query options
	 * @returns Cirql query builder
	 */
	query<R extends ZodTypeAny>(options: SimpleQueryOptions<R>) {
		return this.#push({
			query: options.query,
			schema: options.schema || z.any() as unknown as R
		}, options.params || {});
	}

	/**
	 * Start a new query and select multiple records with support for parameters
	 * 
	 * @param options The query options
	 * @returns Cirql query builder
	 */
	selectMany<R extends ZodTypeAny>(options: SelectQueryOptions<R>) {
		return this.#push({
			query: options.query,
			schema: options.schema?.array() || z.any().array() as unknown as R
		}, options.params || {});
	}

	/**
	 * Select a single record with support for parameters
	 * 
	 * @param options The query options
	 * @returns Cirql query builder
	 */
	selectOne<R extends ZodTypeAny>(options: SelectQueryOptions<R>) {
		let query = options.query;

		if (query instanceof SelectQueryWriter) {
			query = query.limit(1);
		}

		return this.#push({
			query: options.query,
			schema: options.schema?.nullable() || z.any() as unknown as R,
			transform(data) {
				if (data.length > 1) {
					throw new CirqlError('Query returned multiple results, only one was expected', 'too_many_results');
				}

				return data[0] ?? null;
			}
		}, options.params || {});
	}

	/**
	 * Create a new record from the given data. You can use the raw() function
	 * to insert a raw value into the query.
	 * 
	 * @param options The query options
	 * @returns Cirql query builder
	 */
	create<R extends ZodTypeAny>(options: CreateQueryOptions<R>) {
		const tb = nextId('tb'); 
		const id = nextId('id');
		const fields = buildFieldMap(options.data);
		const target = options.id ? thing(tb, id) : table(tb);
		const query = `CREATE ${target} SET ${fields.query}`;

		const params = {
			...fields.values,
			[tb]: options.table,
			[id]: options.id || ''
		};

		return this.#push({
			query: query,
			schema: options.schema || z.any() as unknown as R,
			transform(data) {
				return data[0];
			}
		}, params);
	}

	/**
	 * Update one or more records with the given data. You can use the raw()
	 * function to insert a raw value into the query.
	 * 
	 * @param options The query options
	 * @returns Cirql query builder
	 */
	update<R extends ZodTypeAny>(options: UpdateQueryOptions<R>) {
		const tb = nextId('tb'); 
		const id = nextId('id');
		const fields = buildFieldMap(options.data);
		const query = `UPDATE ${thing(tb, id)} SET ${fields.query}`;

		const params = {
			...fields.values,
			[tb]: options.table,
			[id]: options.id
		};

		return this.#push({
			query: query,
			schema: options.schema || z.any() as unknown as R,
			transform(data) {
				return data[0];
			}
		}, params);
	}

	/**
	 * Remove a single record by its unique ID
	 * 
	 * @param options The query options
	 * @returns Cirql query builder
	 */
	delete(options: DeleteQueryOptions) {
		const tb = nextId('tb'); 
		const id = nextId('id');
		const target = options.id ? thing(tb, id) : table(tb);
		const query = `DELETE ${target}${options.where ? ` WHERE ${options.where[Raw]}` : ''}`;

		const params = {
			...options.params,
			[tb]: options.table,
			[id]: options.id
		};

		return this.#push({
			query: query,
			schema: z.void()
		}, params);
	}

	/**
	 * Return the amount of records that match the given query.
	 * 
	 * @param options The query options
	 * @returns Cirql query builder
	 */
	count(options: CountQueryOptions) {
		const tb = nextId('tb');
		const query = select('count()').from(table(tb)).where(options.where?.[Raw] || '').groupAll();

		const params = {
			...options.params,
			[tb]: options.table
		}

		return this.#push({
			query: query,
			schema: z.number(),
			transform(data) {
				return data[0].count;
			},
		}, params);
	}
	
	/**
	 * Relate a record to another record over an edge.
	 * 
	 * @param options The query options
	 * @returns Cirql query builder
	 */
	relate(options: RelateQueryOptions) {
		const fromTable = nextId('fromTable');
		const fromId = nextId('fromId');
		const toTable = nextId('toTable');
		const toId = nextId('toId');
		const edge = nextId('edge');
		const from = thing(fromTable, fromId);
		const to = thing(toTable, toId);

		let query = `RELATE ${from}->$${edge}->${to}`;
		let params = {
			[fromTable]: options.fromTable,
			[fromId]: options.fromId,
			[toTable]: options.toTable,
			[toId]: options.toId,
			[edge]: options.edge
		};

		if (options.data) {
			const fields = buildFieldMap(options.data);

			query += ` SET ${fields.query}`;
			params = {
				...params,
				...fields.values
			};
		}
		
		return this.#push({
			query: query,
			schema: z.void()
		}, params);
	}

	/**
	 * Execute the query and return the results
	 * 
	 * @returns The query results
	 */
	async execute(): Promise<Result<T>> {
		if (!this.#adapter.onRequest()) {
			throw new CirqlError('There is no active connection to the database', 'no_connection');
		}
		
		if (this.#queries.length === 0) {
			return [] as any;
		}

		const query = this.#buildQuery();
		const results: any[] = [];

		this.#adapter.onLog(query, this.#params);

		const response = await this.#adapter.onQuery(query, this.#params);
	
		if (!Array.isArray(response) || response.length !== this.#queries.length) {
			throw new CirqlError('The response from the database was invalid', 'invalid_response');
		}

		for (let i = 0; i < response.length; i++) {
			const { schema, transform } = this.#queries[i];
			const { status, result } = response[i];

			if (status !== 'OK') {
				throw new CirqlError(`Query ${i + 1} returned a non-successful status code: ${status}`, 'invalid_response');
			}

			const transformed = transform ? transform(result) : result;
			const parsed = schema.safeParse(transformed);
			
			if (!parsed.success) {
				throw new CirqlParseError(`Query ${i + 1} failed to parse`, parsed.error);
			}

			results.push(parsed.data);
		}

		return results as any;
	}

	/**
	 * Execute the query and return only the first query result
	 * 
	 * @returns The result of the first query
	 */
	async single(): Promise<SingleResult<T>> {
		const results = await this.execute();

		if (results.length === 0) {
			throw new CirqlError('You must specify at least on query', 'invalid_request');
		}
		
		return results[0];
	}

	/**
	 * Execute the query as a transaction and return the results
	 * 
	 * @returns The query results
	 */
	transaction() {
		this.#queryPrefix = 'BEGIN TRANSACTION';
		this.#querySuffix = 'COMMIT TRANSACTION';

		return this.execute();
	}

	#buildQuery() {
		let queries = this.#queries.map(q => parseQuery(q.query));

		if (this.#queryPrefix) {
			queries = [this.#queryPrefix, ...queries];
		}

		if (this.#querySuffix) {
			queries = [...queries, this.#querySuffix];
		}

		return queries.join(';\n');
	}

}