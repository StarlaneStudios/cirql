import { SchemafulQueryWriter, Where } from "./types";
import { parseWhereClause } from "./parser";
import { Schemaful } from "./symbols";
import { z, ZodNumber } from "zod";

interface CountQueryState {
	target: string;
	where: string | undefined;
}

/**
 * The query writer implementations for SELECT queries. Remember to
 * always make sure of parameters to avoid potential SQL injection.
 * 
 * When prevention of SQL injections is important, avoid passing
 * variables to all functions except `where`.
 * 
 * When using Cirql server side, never trust record ids directly
 * passed to the query writer. Always use the `fromRecord` function
 * to ensure the record id has an intended table name.
 */
export class CountQueryWriter implements SchemafulQueryWriter<ZodNumber, 'one'> {
	
	readonly #state: CountQueryState;

	constructor(state: CountQueryState) {
		this.#state = state;
	}
	
	readonly [Schemaful] = true;
	readonly _schema = z.number();
	readonly _quantity = 'one'

	/**
	 * Define the where clause for the query. All values will be escaped
	 * automatically. Use of `raw` is supported, as well as any operators
	 * wrapping the raw function.
	 * 
	 * @param where The where clause
	 * @returns The query writer
	 */
	where(where: string|Where) {
		if (typeof where === 'object') {
			where = parseWhereClause(where);	
		}

		return this.#push({ where });
	}

	toQuery(): string {
		const {
			target,
			where,
		} = this.#state;

		if (!target) {
			throw new Error('No target specified');
		}

		let builder = `SELECT count() FROM ${target}`;

		if (where) {
			builder += ` WHERE ${where}`;
		}

		builder += ' GROUP BY ALL';

		return builder;
	}

	#push(extra: Partial<CountQueryState>) {
		return new CountQueryWriter({
			...this.#state,
			...extra
		});
	}

}

/**
 * Start a new count query which will return the amount of
 * rows in a given table.
 * 
 * @param target The target table
 * @returns The query writer
 */
export function count(target: string): CountQueryWriter {
	return new CountQueryWriter({
		target: target,
		where: undefined
	});
}