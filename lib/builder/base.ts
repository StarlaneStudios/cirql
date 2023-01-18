import { TypeOf, z, ZodTypeAny } from "zod";
import { Organisation } from "../../src/main";
import { BuiltQuery, QueryWriter, select } from "../writer";
import { query } from "../writer/query";
import { CirqlQuery } from "./query";
import { CirqlQueries, SimpleQueryOptions, SelectQueryOptions, CreateQueryOptions, UpdateQueryOptions, DeleteQueryOptions, CountQueryOptions, RelateQueryOptions, Params, LetQueryOptions, IfQueryOptions } from "./types";

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

		const q = select().from('users').where({ id: 1 }).one().apply(z.any());

		const res = await this.transaction(
			select().from('users').where({ id: 1 }).apply(Organisation),
			select().from('users').apply(Organisation),
			query('SELECT * FROM users').apply()
		);
	}

	transaction<T extends readonly BuiltQuery<ZodTypeAny>[]>(...queries: T): { [K in keyof T]: TypeOf<T[K][1]> } {
		return {} as any;
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