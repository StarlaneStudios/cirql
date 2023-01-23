import { ZodTypeAny } from "zod";
import { GenericQueryWriter, Quantity, SchemafulQueryWriter } from "../writer";
import { CirqlError, CirqlParseError } from "../errors";
import { Schemaful } from "../writer/symbols";
import { MultiTypeOf, Params, QuantitativeTypeOf, QueryRequest } from "./types";

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
export abstract class CirqlBaseImpl extends EventTarget {

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
			const { query, schema, validate } = options.queries[i];
			const { status, result, detail } = response[i];
			const quantity = query._quantity as Quantity;

			if (status !== 'OK') {
				throw new CirqlError(`Query ${i + 1} returned a non-successful status code: ${status}: ${detail}`, 'invalid_response');
			}

			if (quantity == 'zero') {
				results.push(undefined);
				continue;
			}

			const transformed: any[] = query._transform?.(result) ?? result;
			const resultList = Array.isArray(transformed) ? transformed : [transformed];

			let values: any[];

			if (validate === false) {
				values = resultList;
			} else {
				const theSchema: ZodTypeAny = isSchemaful(query) ? query._schema : schema;
				const parsed = theSchema.array().safeParse(resultList);

				if (!parsed.success) {
					throw new CirqlParseError(`Query ${i + 1} failed to parse`, parsed.error);
				}
				
				values = parsed.data;
			}

			if (quantity == 'one' || quantity == 'maybe') {
				if (quantity == 'one' && values.length === 0) {
					throw new CirqlError(`Query ${i + 1} expected at least one result but got ${values.length}`, 'invalid_response');
				}

				if (values.length > 1) {
					throw new CirqlError(`Query ${i + 1} expected at most one result but got ${values.length}`, 'invalid_response');
				}

				results.push(values[0] || null);
			} else {
				results.push(values);
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

}