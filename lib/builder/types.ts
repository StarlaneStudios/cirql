import { input, TypeOf, ZodArray, ZodNullable, ZodTypeAny } from 'zod';
import { RawQuery } from '../raw';
import { ConnectionDetails, CredentialDetails } from '../types';
import { QueryWriter } from '../writer/types';
import { CirqlQuery } from './query';

export type Params = Record<string, any>;
export type Result<T extends readonly Query<ZodTypeAny>[]> = { [K in keyof T]: TypeOf<T[K]['schema']> };
export type SingleResult<T extends readonly Query<ZodTypeAny>[]> = TypeOf<T[0]['schema']>;
export type Input<D> = { [K in keyof Omit<D, 'id'>]: D[K] | RawQuery };

/**
 * The base contract describing all essential Cirql methods
 */
export interface CirqlQueries {

	/**
	 * Create a new empty query instance. This is useful for chaining multiple
	 * queries together without having to specify an initial query.
	 * 
	 * @returns Cirql query builder
	 */
	prepare(): CirqlQuery<readonly []>;

	/**
	 * Execute a raw query with support for parameters and return the result
	 * 
	 * @param options The query options
	 * @returns The query result
	 */
	query<R extends ZodTypeAny>(options: SimpleQueryOptions<R>): Promise<SingleResult<readonly [Query<R>]>>;

	/**
	 * Select multiple records with support for parameters and return the result
	 * 
	 * @param options The query options
	 * @returns The query result
	 */
	selectMany<R extends ZodTypeAny>(options: SelectQueryOptions<R>): Promise<SingleResult<readonly [Query<R | ZodArray<R, "many">>]>>;

	/**
	 * Select a single record with support for parameters and return the result
	 * 
	 * @param options The query options
	 * @returns The query result
	 */
	selectOne<R extends ZodTypeAny>(options: SelectQueryOptions<R>): Promise<SingleResult<readonly [Query<R | ZodNullable<R>>]>>;

	/**
	 * Create a new record from the given data and return the result.
	 * You can use the raw() function to insert a raw value into the query.
	 * 
	 * @param options The query options
	 * @returns The query result
	 */
	create<R extends ZodTypeAny>(options: CreateQueryOptions<R>): Promise<SingleResult<readonly [Query<R>]>>;

	/**
	 * Update one or more records with the given data and return the result.
	 * You can use the raw() function to insert a raw value into the query.
	 * 
	 * @param options The query options
	 * @returns The query result
	 */
	update<R extends ZodTypeAny>(options: UpdateQueryOptions<R>): Promise<SingleResult<readonly [Query<R>]>>;

	/**
	 * Remove a single record by its unique id
	 * 
	 * @param options The query options
	 */
	delete(options: DeleteQueryOptions): Promise<void>;

	/**
	 * Return the amount of records that match the given
	 * query.
	 * 
	 * @param options The query options
	 * @returns The query result
	 */
	count(options: CountQueryOptions): Promise<number>;

	/**
	 * Relate a record to another record over an edge.
	 * 
	 * @param options The query options
	 */
	relate(options: RelateQueryOptions): Promise<void>;

}

export interface Query<T extends ZodTypeAny> {
	query: string | QueryWriter;
	schema: T;
	transform?: (data: any[]) => any;
}

export interface FieldMap {
	query: string,
	values: Record<string, any>
};

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
	schema?: S;
}

export interface ParameterizedQuery {
	params?: Record<string, any>;
}

export interface StringQuery {
	query: string | QueryWriter;
}

export type CountQueryOptions = ParameterizedQuery & { table: string, where?: RawQuery };
export type DeleteQueryOptions = ParameterizedQuery & { table: string, id?: string, where?: RawQuery };
export type SelectQueryOptions<S extends ZodTypeAny> = StringQuery & ParameterizedQuery & SchemafulQuery<S>;
export type SimpleQueryOptions<S extends ZodTypeAny> = StringQuery & ParameterizedQuery & SchemafulQuery<S>;
export type CreateQueryOptions<S extends ZodTypeAny, D = input<S>> = SchemafulQuery<S> & { table: string, id?: string, data: Input<D> };
export type UpdateQueryOptions<S extends ZodTypeAny, D = input<S>> = SchemafulQuery<S> & { table: string, id: string, data: Partial<Input<D>> };
export type RelateQueryOptions<D extends {} = {}> = { fromTable: string, fromId: string, edge: string, toTable: string, toId: string, data?: D };