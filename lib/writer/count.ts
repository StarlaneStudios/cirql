import { RecordRelation, SchemafulQueryWriter, Where } from "./types";
import { parseWhereClause } from "./parser";
import { Schemaful } from "../symbols";
import { z, ZodNumber } from "zod";
import { getRelationFrom, getRelationTo, thing, useSurrealValueUnsafe } from "../helpers";
import { eq } from "../sql/operators";
import { CirqlWriterError } from "../errors";
import { SurrealValue } from "../types";

interface CountQueryState {
	target: string;
	where: string | undefined;
	relation: boolean;
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

	get _state() {
		return Object.freeze({...this.#state});
	}

	/**
	 * Define the where clause for the query. All values will be escaped
	 * automatically. Use of `raw` is supported, as well as any operators
	 * wrapping the raw function.
	 * 
	 * @param where The where clause
	 * @returns The query writer
	 */
	where(where: string|Where) {
		if (this.#state.relation) {
			throw new CirqlWriterError('Cannot use where clause with countRelation');
		}

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

		builder += ' GROUP ALL';

		return builder;
	}

	_transform(response: any[]): any[] {
		return response.map(row => row['count']);
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
 * rows in a given table. You can either pass a table name or
 * pass a record id in conjunction with `.where()` to test
 * whether a specific record exists.
 * 
 * @param target The target table
 * @returns The query writer
 */
export function count(target: SurrealValue): CountQueryWriter {
	return new CountQueryWriter({
		target: useSurrealValueUnsafe(target),
		where: undefined,
		relation: false
	});
}

/**
 * Start a new count query restricted to the given record. This
 * is only useful in conjunction with `.where()` in order to
 * test whether a specific record matches a given condition.
 * 
 * @param record The record id
 * @returns The query writer
 */
export function countRecord(record: string): CountQueryWriter

/**
 * Start a new count query restricted to the given record. This
 * is only useful in conjunction with `.where()` in order to
 * test whether a specific record matches a given condition.
 * 
 * @param table The record table
 * @param id The record id, either the full id or just the unique id
 * @returns The query writer
 */
export function countRecord(table: string, id: string): CountQueryWriter

export function countRecord(recordOrTable: string, id?: string): CountQueryWriter {
	return new CountQueryWriter({
		target: id === undefined ? JSON.stringify(recordOrTable) : thing(recordOrTable, id),
		where: undefined,
		relation: false
	});
}

/**
 * Start a new count query restricted to the given relation. This
 * is only useful to test whether a specific relation exists.
 * 
 * Since this function will automatically configure a where clause, calling
 * `.where()` manually will throw an exception.
 * 
 * @param relation The relation information
 * @returns The query writer
 */
export function countRelation(relation: RecordRelation): CountQueryWriter {
	return new CountQueryWriter({
		target: relation.edge,
		where: parseWhereClause({
			in: eq(getRelationFrom(relation)),
			out: eq(getRelationTo(relation))
		}),
		relation: true
	});
}