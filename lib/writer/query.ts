import { ZodTypeAny } from "zod";
import { Quantity, QueryWriter, Schema } from "./types";

/**
 * A special query writer implementation for executing raw queries.
 * 
 * When prevention of SQL injections is important, avoid passing
 * any variables directly to this query. Instead, use params.
 */
class PlainQueryWriter<S extends Schema, Q extends Quantity> implements QueryWriter<S, Q> {

	readonly #schema: S;
	readonly #query: string;
	readonly #quantity: Q;

	constructor(schema: S, query: string, quantity: Q) {
		this.#schema = schema;
		this.#query = query;
		this.#quantity = quantity;
	}

	get _quantity() {
		return this.#quantity;
	}

	get _schema() {
		return this.#schema;
	}

	/**
	 * Define the schema that should be used to
	 * validate the query result.
	 * 
	 * @param schema The schema to use
	 * @returns The query writer
	 */
	with<NS extends ZodTypeAny>(schema: NS) {
		return new PlainQueryWriter(schema, this.#query, this.#quantity);
	}

	/**
	 * Expect at most one record to be returned
	 * 
	 * @returns The query writer
	 */
	single() {
		return new PlainQueryWriter(this.#schema, this.#query, 'maybe');
	}

	toQuery(): string {
		return this.#query;
	}

}

/**
 * Create a query writer for the given raw query string
 * 
 * @param rawQuery The 
 * @returns The query writer
 */
export function query(rawQuery: string) {
	return new PlainQueryWriter(null, rawQuery, 'many');
}