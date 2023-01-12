import { input, TypeOf, ZodTypeAny } from 'zod';
import { Raw } from '../constants';
import { ConnectionDetails } from '../types';
import { QueryWriter } from '../writer/types';

export type RawQuery = { [Raw]: string };
export type Params = Record<string, any>;
export type Result<T extends readonly Query<ZodTypeAny>[]> = { [K in keyof T]: TypeOf<T[K]['schema']> };
export type SingleResult<T extends readonly Query<ZodTypeAny>[]> = TypeOf<T[0]['schema']>;
export type Input<D> = { [K in keyof Omit<D, 'id'>]: D[K] | RawQuery };

export interface Query<T extends ZodTypeAny> {
	query: string | QueryWriter;
	schema: T;
	transform?: (data: any[]) => any;
}

export interface FieldMap {
	query: string,
	values: Record<string, any>
};

export interface CirqlOptions {
	connection: ConnectionDetails;
	autoConnect?: boolean;
	logging?: boolean;
	logPrinter?: (query: string, params: any) => void;
	retryCount?: number;
	retryDelay?: number;
}

export interface SchemafulQuery<S extends ZodTypeAny> {
	schema: S;
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
export type SimpleQueryOptions<S extends ZodTypeAny> = StringQuery & ParameterizedQuery & Partial<SchemafulQuery<S>>;
export type CreateQueryOptions<S extends ZodTypeAny, D = input<S>> = SchemafulQuery<S> & { table: string, id?: string, data: Input<D> };
export type UpdateQueryOptions<S extends ZodTypeAny, D = input<S>> = SchemafulQuery<S> & { table: string, id: string, data: Partial<Input<D>> };
export type RelateQueryOptions<D extends {} = {}> = { fromTable: string, fromId: string, edge: string, toTable: string, toId: string, data?: D };