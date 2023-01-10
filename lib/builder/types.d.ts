import { ZodTypeAny } from 'zod';
import { ConnectionDetails } from '../types';

export interface CirqlOptions {
	connection: ConnectionDetails;
	autoConnect?: boolean;
	logging?: boolean;
	logPrinter?: (query: string, params: any) => void;
}

export interface SchemafulQuery<S extends ZodTypeAny> {
	schema: S;
}

export interface ParameterizedQuery {
	params?: Record<string, any>;
}

export interface StringQuery {
	query: string;
}

export type SimpleQueryOptions = StringQuery & ParameterizedQuery;
export type CountQueryOptions = ParameterizedQuery & { table: string, where?: string };
export type DeleteQueryOptions = ParameterizedQuery & { table: string, id?: string, where?: string };
export type SelectQueryOptions<S extends ZodTypeAny> = StringQuery & ParameterizedQuery & SchemafulQuery<S>;
export type CreateQueryOptions<S extends ZodTypeAny, D extends {} = {}> = SchemafulQuery<S> & { table: string, id?: string, data: D };
export type UpdateQueryOptions<S extends ZodTypeAny, D extends {} = {}> = SchemafulQuery<S> & { table: string, id: string, data: D };
export type RelateQueryOptions<D extends {} = {}> = { fromTable: string, fromId: string, edge: string, toTable: string, toId: string, data?: D };