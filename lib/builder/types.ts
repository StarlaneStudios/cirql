import { Quantity, SchemafulQueryWriter, GenericQueryWriter } from '../writer';
import { TypeOf, ZodTypeAny } from 'zod';
import { ConnectionDetails, CredentialDetails } from '../types';

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