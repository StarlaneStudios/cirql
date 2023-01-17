import { SimpleQueryOptions, SelectQueryOptions, CreateQueryOptions, UpdateQueryOptions, DeleteQueryOptions, CountQueryOptions, RelateQueryOptions, Params, Query, Result, SingleResult, LetQueryOptions, IfQueryOptions } from "./types";
import { isRaw, parseQuery, useValueOrRaw } from "../helpers";
import { z, ZodArray, ZodTypeAny } from 'zod';
import { CirqlError, CirqlParseError } from "../errors";
import { select, SelectQueryWriter } from "../writer/select";
import { Raw } from "../raw";
import { CirqlAdapter } from "./base";
import { create, createRecord } from "../writer/create";
import { update, updateRecord } from "../writer/update";
import { del, delRecord } from "../writer/delete";
import { relateRecords } from "../writer/relate";

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

	/**
	 * Execute any query with support for parameters and schema
	 * validation. When possible, use the more specific query
	 * methods instead.
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
	 * and schema validation.
	 * 
	 * @param options The query options
	 * @returns Cirql query builder
	 */
	selectMany<R extends ZodTypeAny>(options: SelectQueryOptions<R>) {
		return this.#push({
			query: options.query,
			schema: options.schema?.array() || z.any().array() as unknown as ZodArray<R>
		}, options.params || {});
	}

	/**
	 * Select a single record with support for parameters and schema validation.
	 * When passing a `SelectQueryWriter` the `limit` will automatically be set
	 * to 1.
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
	 * Create a new record from the given data. `data` supports using
	 * `raw` values as well as operator functions.
	 * 
	 * @param options The query options
	 * @returns Cirql query builder
	 */
	create<R extends ZodTypeAny>(options: CreateQueryOptions<R>) {
		const query = options.id
			? createRecord(options.table, options.id)
			: create(options.table);

		return this.#push({
			query: query.setAll(options.data),
			schema: options.schema || z.any() as unknown as R,
			transform(data) {
				if (data.length > 1) {
					throw new CirqlError('Create only supports single targets', 'too_many_results');
				}

				return data[0];
			}
		}, options.params || {});
	}

	/**
	 * Update one or more records with the given data. `data` supports using
	 * `raw` values as well as operator functions.
	 * 
	 * @param options The query options
	 * @returns Cirql query builder
	 */
	update<R extends ZodTypeAny>(options: UpdateQueryOptions<R>) {
		const query = options.id
			? updateRecord(options.table, options.id)
			: update(options.table);

		return this.#push({
			query: query.setAll(options.data),
			schema: options.schema || z.any() as unknown as R,
			transform(data) {
				return data[0];
			}
		}, options.params || {});
	}

	/**
	 * Remove one or more records from the database.
	 * 
	 * @param options The query options
	 * @returns Cirql query builder
	 */
	delete(options: DeleteQueryOptions) {
		let query = options.id
			? delRecord(options.table, options.id)
			: del(options.table);
		
		if (options.where) {
			query = query.where(options.where);
		}

		return this.#push({
			query: query,
			schema: z.undefined(),
			skip: true
		}, options.params || {});
	}

	/**
	 * Return the amount of records that match the given query.
	 * 
	 * @param options The query options
	 * @returns Cirql query builder
	 */
	count(options: CountQueryOptions) {
		let query = select('count()').from(options.table).groupAll();

		if (options.where) {
			query = query.where(options.where);
		}

		return this.#push({
			query: query,
			schema: z.number(),
			transform(data) {
				return data[0].count;
			},
		}, options.params || {});
	}
	
	/**
	 * Relate a record to another record over an edge. `data` supports using
	 * `raw` values as well as operator functions.
	 * 
	 * @param options The query options
	 * @returns Cirql query builder
	 */
	relate(options: RelateQueryOptions) {
		let query = relateRecords(options.fromTable, options.fromId, options.edge, options.toTable, options.toId);

		if (options.data) {
			query = query.setAll(options.data);
		}
		
		return this.#push({
			query: query,
			schema: z.undefined(),
			skip: true
		}, options.params || {});
	}

	/**
	 * Store a value as parameter in the database for later retrieval.
	 * 
	 * @param options The query options
	 * @returns Cirql query builder
	 */
	let(options: LetQueryOptions) {
		let value: string;

		if (typeof options.value == 'object' && 'toQuery' in options.value) {
			value = `(${options.value.toQuery()})`;
		} else {
			value = useValueOrRaw(options.value);
		}

		return this.#push({
			query: `LET $${options.name} = ${value}`,
			schema: z.undefined(),
			skip: true
		}, {});
	}

	/**
	 * Perform an if statement in the database. Since Cirql cannot statically
	 * determine the result of the if statement, it will return a union of the
	 * two possible results.
	 * 
	 * @param options The query options
	 * @returns Cirql query builder
	 */
	if<T extends ZodTypeAny, E extends ZodTypeAny>(options: IfQueryOptions<T, E>) {
		const { thenSchema, elseSchema } = options;

		if((thenSchema || elseSchema) && (!thenSchema || !elseSchema)) {
			throw new CirqlError('Both thenSchema and elseSchema must be provided if either is specified', 'invalid_request');
		}

		const ifQuery = isRaw(options.if) ? options.if[Raw] : parseQuery(options.if);
		const thenQuery = isRaw(options.then) ? options.then[Raw] : parseQuery(options.then);
		const elseQuery = isRaw(options.else) ? options.else[Raw] : parseQuery(options.else);

		return this.#push({
			query: `IF ${ifQuery} THEN (${thenQuery}) ELSE (${elseQuery}) END`,
			schema: (thenSchema && elseSchema) ? thenSchema.or(elseSchema) : z.any() as unknown as T | E
		}, {});
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
			const { schema, transform, skip } = this.#queries[i];
			const { status, result } = response[i];

			if (status !== 'OK') {
				throw new CirqlError(`Query ${i + 1} returned a non-successful status code: ${status}`, 'invalid_response');
			}

			if (skip) {
				results.push(undefined);
			} else {
				const transformed = transform ? transform(result) : result;
				const parsed = schema.safeParse(transformed);
				
				if (!parsed.success) {
					throw new CirqlParseError(`Query ${i + 1} failed to parse`, parsed.error);
				}

				results.push(parsed.data);
			}
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