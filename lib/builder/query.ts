import { SimpleQueryOptions, SelectQueryOptions, CreateQueryOptions, UpdateQueryOptions, DeleteQueryOptions, CountQueryOptions, RelateQueryOptions, Params } from "./types";
import { Cirql } from "./cirql";
import { TypeOf, z, ZodTypeAny } from 'zod';
import { buildFieldMap } from "./fields";
import { nextId, table, thing } from "../helpers";

type CirqlResult<T extends readonly ZodTypeAny[]> = Promise<{ [K in keyof T]: TypeOf<T[K]> }>;

/**
 * The main Cirql query builder class on which all queries are built. You can
 * append multiple queries and execute these as transaction.
 */
export class CirqlQuery<T extends readonly ZodTypeAny[]> {

	private schemas: T;
	private parent: Cirql;
	private params: Record<string, any>;
	private queries: string[];

	constructor(previous: any, queries: string[], params: Record<string, any>, schemas: T) {
		this.queries = queries;
		this.params = params;
		this.schemas = schemas;

		if (previous instanceof Cirql) {
			this.parent = previous;
		} else {
			this.parent = previous.parent;
		}
	}

	#append<R extends ZodTypeAny>(query: string, params: Params, schema: R) {
		for (const param of Object.keys(params)) {
			if (this.params[param]) {
				throw new Error(`Duplicate parameter name: ${param}`);
			}
		}

		return new CirqlQuery(
			this,
			[...this.queries, query],
			{...this.params, ...params},
			[...this.schemas, schema] as const,
		);
	}

	/**
	 * Execute a raw query with support for parameters
	 * 
	 * @param options The query options
	 * @returns Cirql query builder
	 */
	query<R extends ZodTypeAny>(options: SimpleQueryOptions<R>) {
		return this.#append(options.query, options.params || {}, options.schema || z.any());
	}

	/**
	 * Start a new query and select multiple records with support for parameters
	 * 
	 * @param options The query options
	 * @returns Cirql query builder
	 */
	selectMany<R extends ZodTypeAny>(options: SelectQueryOptions<R>) {
		return this.#append(options.query, options.params || {}, options.schema.array());
	}

	/**
	 * Select a single record with support for parameters
	 * 
	 * @param options The query options
	 * @returns Cirql query builder
	 */
	selectOne<R extends ZodTypeAny>(options: SelectQueryOptions<R>) {
		return this.#append(options.query, options.params || {}, options.schema);
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

		return this.#append(query, params, options.schema);
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

		return this.#append(query, params, options.schema);
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
		const query = `DELETE ${target} ${options.where ? ` WHERE ${options.where}` : ''}`;

		const params = {
			...options.params,
			[tb]: options.table,
			[id]: options.id
		};

		return this.#append(query, params, z.void());
	}

	/**
	 * Return the amount of records that match the given query.
	 * 
	 * @param options The query options
	 * @returns Cirql query builder
	 */
	count(options: CountQueryOptions) {
		const tb = nextId('tb');
		const query = `SELECT count() FROM ${table(tb)} ${options.where ? ` WHERE ${options.where}` : ''} GROUP BY ALL`;

		const params = {
			...options.params,
			[tb]: options.table
		}

		// TODO How will we get to number?

		return this.#append(query, params, z.number());
	}
	
	/**
	 * Relate a record to another record over an edge.
	 * 
	 * @param options The query options
	 * @returns Cirql query builder
	 */
	relate(options: RelateQueryOptions) {
		/*
		let query = `RELATE type::thing($fromTable, $fromId)->$edge->type::thing($toTable, $toId)`;
		let params = {
			fromTable: options.fromTable,
			fromId: options.fromId,
			toTable: options.toTable,
			toId: options.toId,
			edge: options.edge
		};

		if (options.data) {
			const fields = buildFieldMap(options.data);

			query += ` SET ${fields.query}`;
			params = {
				...params,
				...fields.values
			};
		}
		*/
		
		return this.#append('', {}, z.string());
	}

	/**
	 * Execute the query as a transaction and return the results
	 * 
	 * @returns The query results
	 */
	transaction() {
		return this.execute();
	}

	/**
	 * Execute the query and return the results
	 * 
	 * @returns The query results
	 */
	async execute(): CirqlResult<T> {
		if (!this.parent.isConnected) {
			throw new Error('There is no active connection to the database');
		}

		console.log('QUERIES =', this.queries);
		console.log('PARAMS =', this.params);

		return this.schemas.map(schema => schema) as any;
	}

}