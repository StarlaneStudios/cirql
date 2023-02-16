import { Quantity, QueryWriter } from '../writer';
import { TypeOf, ZodTypeAny } from 'zod';
import { ConnectionDetails, AuthenticationDetails } from '../types';

export type QueryRequestBase = {
	params?: Params;
	validate?: boolean;
}

export type InferredQueryRequest<Q extends Quantity, S extends ZodTypeAny> = {
	query: QueryWriter<ZodTypeAny, Q>;
	schema?: S;
}

export type SchemaQueryRequest<Q extends Quantity, S extends ZodTypeAny> = {
	query: QueryWriter<null, Q>;
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
	[K in keyof T]: T[K] extends InferredQueryRequest<any, any>
	? QuantitativeTypeOf<T[K]['query']['_quantity'], T[K]['query']['_schema']>
	: QuantitativeTypeOf<T[K]['query']['_quantity'], T[K]['schema']>
}

export type Params = Record<string, any>;
export type QueryRequest<Q extends Quantity, S extends ZodTypeAny> = QueryRequestBase & (SchemaQueryRequest<Q, S> | InferredQueryRequest<Q, S>);

export interface CirqlBaseOptions {
	connection: ConnectionDetails;
	credentials?: AuthenticationDetails;
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