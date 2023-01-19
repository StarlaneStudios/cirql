import { SelectQueryWriter, QueryWriter, Where, Quantity, SchemafulQueryWriter, GenericQueryWriter } from '../writer';
import { input, TypeOf, ZodArray, ZodNullable, ZodTypeAny } from 'zod';
import { ConnectionDetails, CredentialDetails } from '../types';
import { CirqlQuery } from './query';
import { RawQuery } from '../raw';

export type SchemafulQueryRequest<Q extends Quantity, S extends ZodTypeAny> = {
	query: SchemafulQueryWriter<S, Q>;
	params?: Params;
	schema?: never;
}

export type GenericQueryRequest<Q extends Quantity, S extends ZodTypeAny> = {
	query: GenericQueryWriter<Q>;
	params?: Params;
	schema: S;
}

export type QuantitativeTypeOf<Q extends Quantity, S extends ZodTypeAny> = Q extends 'one'
	? TypeOf<S>
	: Q extends 'maybe'
	? TypeOf<S> | null
	: Q extends 'many'
	? TypeOf<S>[]
	: undefined;

export type MultiTypeOf<T extends QueryRequest<any, any>[]> = {
	[K in keyof T]: T[K] extends SchemafulQueryRequest<any, any>
	? QuantitativeTypeOf<T[K]['query']['_quantity'], T[K]['query']['_schema']>
	: QuantitativeTypeOf<T[K]['query']['_quantity'], T[K]['schema']>
}

export type Params = Record<string, any>;
export type QueryRequest<Q extends Quantity, S extends ZodTypeAny> = SchemafulQueryRequest<Q, S> | GenericQueryRequest<Q, S>;
export type Result<T extends readonly Query<ZodTypeAny>[]> = { [K in keyof T]: TypeOf<T[K]['schema']> };
export type SingleResult<T extends readonly Query<ZodTypeAny>[]> = TypeOf<T[0]['schema']>;
export type Input<D> = { [K in keyof Omit<D, 'id'>]: D[K] | RawQuery };

/**
 * The base contract describing all available query methods
 */
export interface CirqlQueries {

	/**
	 * Execute a single query on the database. Queries can be defined using the
	 * Query Writer API.
	 * 
	 * If you need to execute a raw query string, import and use the
	 * `query` function to wrap the string in a Query Writer.
	 * 
	 * @param request The request to execute
	 * @returns The result of the query
	 */
	execute<Q extends Quantity, S extends ZodTypeAny>(request: QueryRequest<Q, S>): Promise<TypeOf<S>>

	/**
	 * Execute a collection of queries on the database. Queries can be defined using the
	 * Query Writer API.
	 * 
	 * f you need to execute a raw query string, import and use the
	 * `query` function to wrap the string in a Query Writer.
	 * 
	 * The result array will be in the same order as the request array, allowing it to be
	 * destructured into the individual results.
	 * 
	 * @param request 
	 * @returns The results of the queries
	 */
	batch<T extends QueryRequest<any, any>[]>(...request: T): Promise<MultiTypeOf<T>>

	/**
	 * Execute a collection of queries on the database. Queries can be defined using the
	 * Query Writer API. The queries will be executed in a transaction.
	 * 
	 * f you need to execute a raw query string, import and use the
	 * `query` function to wrap the string in a Query Writer.
	 * 
	 * The result array will be in the same order as the request array, allowing it to be
	 * destructured into the individual results.
	 * 
	 * @param request 
	 * @returns The results of the queries
	 */
	transaction<T extends QueryRequest<any, any>[]>(...request: T): Promise<MultiTypeOf<T>>

	/**
	 * Create a new empty query instance. This is useful for chaining multiple
	 * queries together without having to specify an initial query.
	 * 
	 * @returns Cirql query builder
	 * @deprecated Use the new Query API instead
	 */
	prepare(): CirqlQuery<readonly []>;

	/**
	 * Execute a raw query with support for parameters and return the result
	 * 
	 * @param options The query options
	 * @returns The query result
	 * @deprecated Use the new Query API instead
	 */
	query<R extends ZodTypeAny>(options: SimpleQueryOptions<R>): Promise<SingleResult<readonly [Query<R>]>>;

	/**
	 * Select multiple records with support for parameters and return the result
	 * 
	 * @param options The query options
	 * @returns The query result
	 * @deprecated Use the new Query API instead
	 */
	selectMany<R extends ZodTypeAny>(options: SelectQueryOptions<R>): Promise<SingleResult<readonly [Query<ZodArray<R, "many">>]>>;

	/**
	 * Select a single record with support for parameters and return the result
	 * 
	 * @param options The query options
	 * @returns The query result
	 * @deprecated Use the new Query API instead
	 */
	selectOne<R extends ZodTypeAny>(options: SelectQueryOptions<R>): Promise<SingleResult<readonly [Query<ZodNullable<R>>]>>;

	/**
	 * Create a new record from the given data and return the result.
	 * You can use the raw() function to insert a raw value into the query.
	 * 
	 * @param options The query options
	 * @returns The query result
	 * @deprecated Use the new Query API instead
	 */
	create<R extends ZodTypeAny>(options: CreateQueryOptions<R>): Promise<SingleResult<readonly [Query<R>]>>;

	/**
	 * Update one or more records with the given data and return the result.
	 * You can use the raw() function to insert a raw value into the query.
	 * 
	 * @param options The query options
	 * @returns The query result
	 * @deprecated Use the new Query API instead
	 */
	update<R extends ZodTypeAny>(options: UpdateQueryOptions<R>): Promise<SingleResult<readonly [Query<R>]>>;

	/**
	 * Remove a single record by its unique id
	 * 
	 * @param options The query options
	 * @deprecated Use the new Query API instead
	 */
	delete(options: DeleteQueryOptions): Promise<undefined>;

	/**
	 * Return the amount of records that match the given
	 * query.
	 * 
	 * @param options The query options
	 * @returns The query result
	 * @deprecated Use the new Query API instead
	 */
	count(options: CountQueryOptions): Promise<number>;

	/**
	 * Relate a record to another record over an edge.
	 * 
	 * @param options The query options
	 * @deprecated Use the new Query API instead
	 */
	relate(options: RelateQueryOptions): Promise<undefined>;

	/**
	 * Store a value as parameter in the database for later retrieval.
	 * 
	 * @param options The query options
	 * @deprecated Use the new Query API instead
	 */
	let(options: LetQueryOptions): Promise<undefined>;

	/**
	 * Perform an if statement in the database. Since Cirql cannot statically
	 * determine the result of the if statement, it will return a union of the
	 * two possible results.
	 * 
	 * @param options The query options
	 * @deprecated Use the new Query API instead
	 */
	if<T extends ZodTypeAny, E extends ZodTypeAny>(options: IfQueryOptions<T, E>): Promise<SingleResult<readonly [Query<T | E>]>>;

}

export interface Query<T extends ZodTypeAny> {
	query: string | QueryWriter<any>;
	schema: T;
	skip?: boolean;
	transform?: (data: any[]) => any;
}

export interface CirqlBaseOptions {
	connection: ConnectionDetails;
	credentials: CredentialDetails;
	logging?: boolean;
	logPrinter?: (query: string, params: any) => void;
}

export interface CirqlOptions extends CirqlBaseOptions {
	autoConnect?: boolean;
	retryCount?: number;
	retryDelay?: number;
}

export interface CirqlStatelessOptions extends CirqlBaseOptions {

}

export interface SchemafulQuery<S extends ZodTypeAny> {
	schema: S;
}

export interface ParameterizedQuery {
	params?: Record<string, any>;
}

export type LetQueryOptions = { name: string, value: any | RawQuery | QueryWriter<any> };
export type CountQueryOptions = ParameterizedQuery & { table: string, where?: string | Where };
export type DeleteQueryOptions = ParameterizedQuery & { table: string, id?: string, where?: string | Where };
export type SelectQueryOptions<S extends ZodTypeAny> = ParameterizedQuery & SchemafulQuery<S> & { query: string | SelectQueryWriter<any> };
export type SimpleQueryOptions<S extends ZodTypeAny> = ParameterizedQuery & SchemafulQuery<S> & { query: string | QueryWriter<any> };
export type CreateQueryOptions<S extends ZodTypeAny, D = input<S>> = ParameterizedQuery & SchemafulQuery<S> & { table: string, id?: string, data: Input<D> };
export type UpdateQueryOptions<S extends ZodTypeAny, D = input<S>> = ParameterizedQuery & SchemafulQuery<S> & { table: string, id?: string, data: Partial<Input<D>> };
export type RelateQueryOptions<D extends {} = {}> = ParameterizedQuery & { fromTable: string, fromId: string, edge: string, toTable: string, toId: string, data?: D };
export type IfQueryOptions<T extends ZodTypeAny, E extends ZodTypeAny> = { if: string | RawQuery | QueryWriter<any>, then: string | QueryWriter<any>, else: string | RawQuery | QueryWriter<any>, thenSchema: T, elseSchema: E };