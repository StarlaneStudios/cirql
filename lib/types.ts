import { Raw } from "./symbols";
import { Quantity, QueryWriter } from './writer';
import { TypeOf, ZodTypeAny } from 'zod';

export type RawQuery = { [Raw]: string };

export interface RootAuth {
	user: string;
	pass: string;
}

export interface NamespaceAuth {
	NS: string;
	user: string;
	pass: string;
}

export interface DatabaseAuth {
	NS: string;
	DB: string;
	user: string;
	pass: string;
}

export interface ScopeAuth {
	NS: string;
	DB: string;
	SC: string;
	[key: string]: unknown;
}

export interface TokenAuth {
	token: string;
}

export type AuthenticationDetails = TokenAuth | (RootAuth | NamespaceAuth | DatabaseAuth | ScopeAuth);
export type RegistrationDetails = RootAuth | NamespaceAuth | DatabaseAuth | ScopeAuth;

export interface BasePatch {
	path: string;
}

export interface AddPatch extends BasePatch {
	op: "add";
	value: any;
}

export interface RemovePatch extends BasePatch {
	op: "remove";
}

export interface ReplacePatch extends BasePatch {
	op: "replace";
	value: any;
}

export interface ChangePatch extends BasePatch {
	op: "change";
	value: string;
}

export type Patch = AddPatch | RemovePatch | ReplacePatch | ChangePatch;

export interface ConnectionDetails {

	/**
	 * The endpoint to connect to e.g. http://localhost:8000
	*/
	endpoint: string;

	/**
	 * The namespace to connect to for executing queries
	 */
	namespace?: string;

	/**
	 * The database to connect to for executing queries
	 */
	database?: string;

}

/**
 * A value which can be used within a query. Either a
 * raw query string, a query writer, or any other value.
 */
export type SurrealValue = RawQuery | QueryWriter<any, any> | any;

export type QueryRequestBase = {
	params?: Params;
	validate?: boolean;
}

export type InferredQueryRequest<Q extends Quantity, S extends ZodTypeAny> = {
	query: QueryWriter<S, Q>;
	schema?: never;
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

export type SoloTypeOf<T extends QueryRequest<any, any>> =
	T extends InferredQueryRequest<any, any>
	? QuantitativeTypeOf<T['query']['_quantity'], T['query']['_schema']>
	: QuantitativeTypeOf<T['query']['_quantity'], T['schema']>

export type MultiTypeOf<T extends QueryRequest<any, any>[]> = {
	[K in keyof T]: T[K] extends InferredQueryRequest<any, any>
	? QuantitativeTypeOf<T[K]['query']['_quantity'], T[K]['query']['_schema']>
	: QuantitativeTypeOf<T[K]['query']['_quantity'], T[K]['schema']>
}

export type Params = Record<string, any>;
export type QueryRequest<Q extends Quantity, S extends ZodTypeAny> = QueryRequestBase & (SchemaQueryRequest<Q, S> | InferredQueryRequest<Q, S>);

export interface CirqlConnectionOptions {
	connection: ConnectionDetails;
	credentials?: AuthenticationDetails;
}

export interface CirqlBaseOptions {
	logging?: boolean;
	logPrinter?: (query: string, params: any) => void;
}

export interface CirqlStatefulOptions extends CirqlConnectionOptions, CirqlBaseOptions {
	autoConnect?: boolean;
	retryCount?: number;
	retryDelay?: number;
	queryTimeout?: number;
}

export interface CirqlStatelessOptions extends CirqlConnectionOptions, CirqlBaseOptions {

}

export interface CirqlOptions extends CirqlBaseOptions {
	
}