import { ZodTypeAny } from "zod";
import { CirqlQuery } from "./query";
import { CirqlQueries, SimpleQueryOptions, SelectQueryOptions, CreateQueryOptions, UpdateQueryOptions, DeleteQueryOptions, CountQueryOptions, RelateQueryOptions, Params, LetQueryOptions } from "./types";

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

}