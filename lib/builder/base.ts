import { CirqlQueries, SimpleQueryOptions, SelectQueryOptions, CreateQueryOptions, UpdateQueryOptions, Params, IfQueryOptions, QueryRequest, CountQueryOptions, DeleteQueryOptions, LetQueryOptions, RelateQueryOptions, MultiTypeOf, QuantitativeTypeOf } from "./types";
import { ZodTypeAny } from "zod";
import { GenericQueryWriter, Quantity, SchemafulQueryWriter } from "../writer";
import { CirqlQuery } from "./query";
import { CirqlError, CirqlParseError } from "../errors";
import { Schemaful } from "../writer/symbols";

type SendOptions<T> = { queries: T, prefix: string, suffix: string };

function isSchemaful(query: SchemafulQueryWriter<any, any> | GenericQueryWriter<any>): query is SchemafulQueryWriter<any, any> {
	return Schemaful in query;
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

	async execute<Q extends Quantity, S extends ZodTypeAny>(request: QueryRequest<Q, S>): Promise<QuantitativeTypeOf<Q, S>> {
		const [result] = await this.batch(request);

		return result as any;
	}

	async batch<T extends QueryRequest<any, any>[]>(...request: T): Promise<MultiTypeOf<T>> {
		return this.#sendQuery({
			queries: request,
			prefix: '',
			suffix: ''
		});
	}

	async transaction<T extends QueryRequest<any, any>[]>(...request: T): Promise<MultiTypeOf<T>> {
		return this.#sendQuery({
			queries: request,
			prefix: 'BEGIN TRANSACTION',
			suffix: 'COMMIT TRANSACTION'
		});
	}

	async #sendQuery<T extends QueryRequest<any, any>[]>(options: SendOptions<T>): Promise<MultiTypeOf<T>> {
		if (!this.#adapter.onRequest()) {
			throw new CirqlError('There is no active connection to the database', 'no_connection');
		}

		if (options.queries.length === 0) {
			return [] as any;
		}

		const params = this.#buildParams(options);
		const request = this.#buildQuery(options);
		const results: any[] = [];

		this.#adapter.onLog(request, params);

		const response = await this.#adapter.onQuery(request, params);

		if (!Array.isArray(response) || response.length !== options.queries.length) {
			throw new CirqlError('The response from the database was invalid', 'invalid_response');
		}

		for (let i = 0; i < response.length; i++) {
			const { query, schema } = options.queries[i];
			const { status, result, detail } = response[i];
			const quantity = query._quantity as Quantity;

			if (status !== 'OK') {
				throw new CirqlError(`Query ${i + 1} returned a non-successful status code: ${status}: ${detail}`, 'invalid_response');
			}

			if (quantity == 'zero') {
				results.push(undefined);
				continue;
			}

			const theResult: any[] = query._transform?.(result) ?? result;
			const theSchema: ZodTypeAny = isSchemaful(query) ? query._schema : schema;
			const parsed = theSchema.array().safeParse(theResult);

			if (!parsed.success) {
				throw new CirqlParseError(`Query ${i + 1} failed to parse`, parsed.error);
			}

			if (quantity == 'one' || quantity == 'maybe') {
				if (quantity == 'one' && parsed.data.length === 0) {
					throw new CirqlError(`Query ${i + 1} expected at least one result but got ${parsed.data.length}`, 'invalid_response');
				}

				if (parsed.data.length > 1) {
					throw new CirqlError(`Query ${i + 1} expected at most one result but got ${parsed.data.length}`, 'invalid_response');
				}

				results.push(parsed.data[0] || null);
			} else {
				results.push(parsed.data);
			}
		}

		return results as any;
	}

	#buildQuery(options: SendOptions<QueryRequest<any, any>[]>) {
		let queries = options.queries.map(q => q.query.toQuery());

		if (options.prefix) {
			queries = [options.prefix, ...queries];
		}

		if (options.suffix) {
			queries = [...queries, options.suffix];
		}

		return queries.join(';\n');
	}

	#buildParams(options: SendOptions<QueryRequest<any, any>[]>) {
		const params: Params = {};

		for (const query of options.queries) {
			for (const [name, value] of Object.entries(query.params || {})) {
				if (name in params) {
					throw new CirqlError(`The parameter "${name}" was defined multiple times`, 'invalid_query');
				}

				params[name] = value;
			}
		}

		return params;
	}

	// - Functions API

	/** @deprecated Use the new Query API instead */
	prepare(): CirqlQuery<readonly []> {
		return new CirqlQuery(this.#adapter, [] as const);
	}

	/** @deprecated Use the new Query API instead */
	query<R extends ZodTypeAny>(options: SimpleQueryOptions<R>) {
		return this.prepare().query(options).single();
	}

	/** @deprecated Use the new Query API instead */
	selectMany<R extends ZodTypeAny>(options: SelectQueryOptions<R>) {
		return this.prepare().selectMany(options).single();
	}

	/** @deprecated Use the new Query API instead */
	selectOne<R extends ZodTypeAny>(options: SelectQueryOptions<R>) {
		return this.prepare().selectOne(options).single();
	}

	/** @deprecated Use the new Query API instead */
	create<R extends ZodTypeAny>(options: CreateQueryOptions<R>) {
		return this.prepare().create(options).single();
	}

	/** @deprecated Use the new Query API instead */
	update<R extends ZodTypeAny>(options: UpdateQueryOptions<R>) {
		return this.prepare().update(options).single();
	}

	/** @deprecated Use the new Query API instead */
	delete(options: DeleteQueryOptions) {
		return this.prepare().delete(options).single();
	}

	/** @deprecated Use the new Query API instead */
	count(options: CountQueryOptions) {
		return this.prepare().count(options).single();
	}

	/** @deprecated Use the new Query API instead */
	relate(options: RelateQueryOptions) {
		return this.prepare().relate(options).single();
	}

	/** @deprecated Use the new Query API instead */
	let(options: LetQueryOptions) {
		return this.prepare().let(options).single();
	}

	/** @deprecated Use the new Query API instead */
	if<T extends ZodTypeAny, E extends ZodTypeAny>(options: IfQueryOptions<T, E>) {
		return this.prepare().if(options).single();
	}

}