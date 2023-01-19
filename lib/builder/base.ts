import { CirqlQueries, SimpleQueryOptions, SelectQueryOptions, CreateQueryOptions, UpdateQueryOptions, Params, IfQueryOptions, QueryRequest, CountQueryOptions, DeleteQueryOptions, LetQueryOptions, RelateQueryOptions, SchemafulQueryRequest } from "./types";
import { CirqlQuery } from "./query";
import { Quantity } from "../writer";
import { TypeOf, ZodTypeAny } from "zod";

type QuantativeTypeOf<Q extends Quantity, S extends ZodTypeAny> = Q extends 'one'
	? TypeOf<S>
	: Q extends 'maybe'
		? TypeOf<S> | null
		: Q extends 'many'
			? TypeOf<S>[]
			: undefined;

type MultiTypeOf<T extends QueryRequest<any, any>[]> = {
	[K in keyof T]: T[K] extends SchemafulQueryRequest<any, any>
		? QuantativeTypeOf<T[K]['query']['_quantity'], T[K]['query']['_schema']>
		: QuantativeTypeOf<T[K]['query']['_quantity'], T[K]['schema']>
}

/**
 * The adapter used to connect to Cirql implementations
 */
export interface CirqlAdapter {
	onQuery: (query: string, params: Record<string, any>) => Promise<any>;
	onRequest: () => boolean;
	onLog: (query: string, params: Params) => void;
}

/**
 * The abstract base implemention for Cirql. This class is agnostic to
 * the concept of connections.
 */
export abstract class CirqlBaseImpl extends EventTarget implements CirqlQueries {

	#adapter: CirqlAdapter;

	constructor(config: CirqlAdapter) {
		super();
		this.#adapter = config;
	}

	execute<Q extends Quantity, S extends ZodTypeAny>(request: QueryRequest<Q, S>): Promise<TypeOf<S>> {
		return request as any;
	}

	batch<T extends QueryRequest<any, any>[]>(...request: T): Promise<MultiTypeOf<T>> {
		return request as any;
	}

	transaction<T extends QueryRequest<any, any>[]>(...request: T): Promise<MultiTypeOf<T>> {
		return request as any;
	}

	// - Functions API

	prepare(): CirqlQuery<readonly []> {
		return new CirqlQuery(this.#adapter, [] as const);
	}

	query<R extends ZodTypeAny>(options: SimpleQueryOptions<R>) {
		return this.prepare().query(options).single();
	}

	selectMany<R extends ZodTypeAny>(options: SelectQueryOptions<R>) {
		return this.prepare().selectMany(options).single();
	}

	selectOne<R extends ZodTypeAny>(options: SelectQueryOptions<R>) {
		return this.prepare().selectOne(options).single();
	}

	create<R extends ZodTypeAny>(options: CreateQueryOptions<R>) {
		return this.prepare().create(options).single();
	}

	update<R extends ZodTypeAny>(options: UpdateQueryOptions<R>) {
		return this.prepare().update(options).single();
	}

	delete(options: DeleteQueryOptions) {
		return this.prepare().delete(options).single();
	}

	count(options: CountQueryOptions) {
		return this.prepare().count(options).single();
	}

	relate(options: RelateQueryOptions) {
		return this.prepare().relate(options).single();
	}

	let(options: LetQueryOptions) {
		return this.prepare().let(options).single();
	}

	if<T extends ZodTypeAny, E extends ZodTypeAny>(options: IfQueryOptions<T, E>) {
		return this.prepare().if(options).single();
	}

}