import { GenericQueryWriter, Quantity, RecordRelation, ReturnMode, Where } from "./types";
import { CirqlWriterError } from "../errors";
import { parseWhereClause } from "./parser";
import { Generic } from "./symbols";
import { isListLike, thing } from "../helpers";
import { raw } from "../sql/raw";
import { eq } from "../sql/operators";

interface DeleteQueryState<Q extends Quantity> {
	quantity: Q;
	targets: string;
	where: string | undefined;
	returnMode: ReturnMode | 'fields' | undefined;
	returnFields: string[];
	timeout: number | undefined;
	parallel: boolean;
	unrelate: boolean;
}

/**
 * The query writer implementations for DELETE queries.
 * 
 * When prevention of SQL injections is important, avoid passing
 * variables to all functions except `where`.
 * 
 * When using Cirql server side, never trust record ids directly
 * passed to the query writer. Always use the `deleteRecord` function
 * to ensure the record id has an intended table name.
 */
export class DeleteQueryWriter<Q extends Quantity> implements GenericQueryWriter<Q> {
	
	readonly #state: DeleteQueryState<Q>;

	constructor(state: DeleteQueryState<Q>) {
		this.#state = state;
	}

	readonly [Generic] = true;

	get _quantity() {
		return this.#state.quantity;
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
		if (this.#state.unrelate) {
			throw new CirqlWriterError('Cannot use where clause with delRelation');
		}

		if (typeof where === 'object') {
			where = parseWhereClause(where);	
		}

		return this.#push({ where });
	}

	/**
	 * Define the return behavior for the query
	 * 
	 * @param value The return behavior
	 * @returns The query writer
	 */
	return(mode: ReturnMode) {
		return this.#push({ returnMode: mode });
	}
	
	/**
	 * Define the return behavior for the query
	 * 
	 * @param value The return behavior
	 * @returns The query writer
	 */
	returnFields(...fields: string[]) {
		return this.#push({
			returnMode: 'fields',
			returnFields: fields
		});
	}

	/**
	 * Set the timeout for the query
	 * 
	 * @param seconds The timeout in seconds
	 * @returns The query writer
	 */
	timeout(timeout: number) {
		return this.#push({ timeout });
	}

	/**
	 * Run the query in parallel
	 * 
	 * @returns The query writer
	 */
	parallel() {
		return this.#push({ parallel: true });
	}

	toQuery(): string {
		const {
			targets,
			where,
			returnMode,
			returnFields,
			timeout,
			parallel
		} = this.#state;

		if (!targets) {
			throw new Error('No targets specified');
		}
		
		let builder = `DELETE ${targets}`;

		if (where) {
			builder += ` WHERE ${where}`;
		}

		if (returnMode === 'fields') {
			builder += ` RETURN ${returnFields.join(', ')}`;
		} else if(returnMode) {
			builder += ` RETURN ${returnMode.toUpperCase()}`;
		}

		if (timeout) {
			builder += ` TIMEOUT ${timeout}s`;
		}

		if (parallel) {
			builder += ' PARALLEL';
		}

		return builder;
	}

	#push<N extends Quantity = Q>(extra: Partial<DeleteQueryState<N>>) {
		return new DeleteQueryWriter({
			...this.#state,
			...extra
		});
	}

}

/**
 * Start a new DELETE query with the given targets. Since delete
 * is a reserved word in JavaScript, this function is named `del`.
 * 
 * @param targets The targets to delete
 * @returns The query writer
 */
export function del(...targets: string[]) {
	if (targets.length === 0) {
		throw new CirqlWriterError('At least one target must be specified');
	}

	if (isListLike(...targets)) {
		throw new CirqlWriterError('Multiple targets must be specified seperately');
	}

	return new DeleteQueryWriter({
		quantity: 'many',
		targets: targets.join(', '),
		where: undefined,
		returnMode: 'before',
		returnFields: [],
		timeout: undefined,
		parallel: false,
		unrelate: false
	});
}

/**
 * Start a new DELETE query for the given record. This function
 * is especially useful in situations where the table name within a
 * record pointer may be spoofed, and a specific table name is required.
 * 
 * @param table The record table
 * @param id The record id, either the full id or just the unique id
 * @returns The query writer
 */
export function delRecord(table: string, id: string) {
	return new DeleteQueryWriter({
		quantity: 'maybe',
		targets: thing(table, id),
		where: undefined,
		returnMode: 'before',
		returnFields: [],
		timeout: undefined,
		parallel: false,
		unrelate: false
	});
}

/**
 * Start a new DELETE query that deletes the given relation. Since this
 * function will automatically configure a where clause, calling `.where()`
 * manually will throw an exception.
 * 
 * @param relation The relation information
 * @returns The query writer
 */
export function delRelation(relation: RecordRelation) {
	return new DeleteQueryWriter({
		quantity: 'maybe',
		targets: relation.edge,
		where: parseWhereClause({
			in: eq(raw(thing(relation.fromTable, relation.fromId))),
			out: eq(raw(thing(relation.toTable, relation.toId)))
		}),
		returnMode: 'before',
		returnFields: [],
		timeout: undefined,
		parallel: false,
		unrelate: true
	});
}