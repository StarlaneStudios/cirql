import { SimpleQueryOptions, SelectQueryOptions, CreateQueryOptions, UpdateQueryOptions, DeleteQueryOptions, CountQueryOptions, RelateQueryOptions } from "./types";
import { Cirql } from "./builder";
import { ZodTypeAny } from 'zod';

/**
 * The main Cirql query builder class on which all queries are built. You can
 * append multiple queries and execute these as transaction.
 */
export class CirqlQuery<T extends readonly unknown[]> {

	private ops: T;
	private parent: Cirql;
	private params: Record<string, any>;
	private queries: string[];

	constructor(previous: any, operations: T) {
		this.ops = operations;

		if (previous instanceof Cirql) {
			this.parent = previous;
			this.params = {};
			this.queries = [];
		} else {
			this.parent = previous.parent;
			this.params = previous.params;
			this.queries = previous.queries;
		}
	}

	#debug(query: string) {
		if (this.parent.options.logging) {
			const printer = this.parent.options.logPrinter || console.debug;

			printer(query);
		}
	}

	#addParams(params: Record<string, any>) {
		for (const [key, value] of Object.entries(params)) {
			if (this.params[key]) {
				throw new Error(`Duplicate parameter name: ${key}`);
			}

			this.params[key] = value;
		}
	}

	/**
	 * Execute a raw query with support for parameters
	 * 
	 * @param options The query options
	 * @returns Cirql query builder
	 */
	query(options: SimpleQueryOptions) {
		this.queries.push(options.query);
		
		if (options.params) {
			this.#addParams(options.params);
		}

		return new CirqlQuery(this, [...this.ops, {} as any] as const);
	}

	/**
	 * Start a new query and select multiple records with support for parameters
	 * 
	 * @param options The query options
	 * @returns Cirql query builder
	 */
	selectMany<R extends ZodTypeAny>(options: SelectQueryOptions<R>) {
		const result = await this.execute(options);
		const parsed = options.schema!.array().safeParse(result);

		if (parsed.success) {
			return parsed.data;
		}

		throw new Error('Failed to parse query result', { cause: parsed.error });
		
		return new CirqlQuery(this, [...this.ops, options.schema.parse({}) as TypeOf<R>] as const);
	}

	/**
	 * Select a single record with support for parameters
	 * 
	 * @param options The query options
	 * @returns Cirql query builder
	 */
	selectOne<R extends ZodTypeAny>(options: SelectQueryOptions<R>) {
		return new CirqlQuery(this, [...this.ops, options.schema.parse({}) as TypeOf<R>] as const);
	}

	/**
	 * Create a new record from the given data. You can use the raw() function
	 * to insert a raw value into the query.
	 * 
	 * @param options The query options
	 * @returns Cirql query builder
	 */
	create<R extends ZodTypeAny>(options: CreateQueryOptions<R>) {
		return new CirqlQuery(this, [...this.ops, options.schema.parse({}) as TypeOf<R>] as const);
	}

	/**
	 * Update one or more records with the given data. You can use the raw()
	 * function to insert a raw value into the query.
	 * 
	 * @param options The query options
	 * @returns Cirql query builder
	 */
	update<R extends ZodTypeAny>(options: UpdateQueryOptions<R>) {
		return new CirqlQuery(this, [...this.ops, {} as any] as const);
	}

	/**
	 * Remove a single record by its unique ID
	 * 
	 * @param options The query options
	 * @returns Cirql query builder
	 */
	delete(options: DeleteQueryOptions) {
		return new CirqlQuery(this, [...this.ops, {} as any] as const);
	}

	/**
	 * Return the amount of records that match the given query.
	 * 
	 * @param options The query options
	 * @returns Cirql query builder
	 */
	count(options: CountQueryOptions) {
		return new CirqlQuery(this, [...this.ops, {} as any] as const);
	}
	
	/**
	 * Relate a record to another record over an edge.
	 * 
	 * @param options The query options
	 * @returns Cirql query builder
	 */
	relate(options: RelateQueryOptions) {
		return new CirqlQuery(this, [...this.ops, {} as any] as const);
	}

	/**
	 * Execute the query as a transaction and return the results
	 * 
	 * @returns The query results
	 */
	transaction(): Promise<T> {
		return this.execute();
	}

	/**
	 * Execute the query and return the results
	 * 
	 * @returns The query results
	 */
	async execute(): Promise<T> {
		if (!this.parent.isConnected) {
			throw new Error('There is no active connection to the database');
		}

		console.log('QUERIES =', this.queries);
		console.log('PARAMS =', this.params);

		return null as any;
	}

}