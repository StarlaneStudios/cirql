import { GenericQueryWriter, Quantity } from "./types";
import { Generic } from "./symbols";

/**
 * A special query writer implementation for executing raw queries.
 * 
 * When prevention of SQL injections is important, avoid passing
 * any variables directly to this query. Instead, use params.
 */
class PlainQueryWriter<Q extends Quantity> implements GenericQueryWriter<Q> {

	readonly #query: string;
	readonly #quantity: Q;

	constructor(query: string, quantity: Q) {
		this.#query = query;
		this.#quantity = quantity;
	}

	readonly [Generic] = true;

	get _quantity() {
		return this.#quantity;
	}

	/**
	 * Expect at most one record to be returned
	 * 
	 * @returns The query writer
	 */
	single() {
		return new PlainQueryWriter(this.#query, 'maybe');
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
	return new PlainQueryWriter(rawQuery, 'many');
}