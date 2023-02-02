import { Order, Ordering, Where, GenericQueryWriter, Quantity, RecordRelation } from "./types";
import { parseWhereClause } from "./parser";
import { Generic } from "../symbols";
import { isListLike, thing, useSurrealValueUnsafe } from "../helpers";
import { CirqlWriterError } from "../errors";
import { eq } from "../sql/operators";
import { raw } from "../sql/raw";
import { SurrealValue } from "../types";

interface SelectQueryState<Q extends Quantity> {
	quantity: Q;
	projections: string | undefined;
	targets: string | undefined;
	where: string | undefined;
	split: string[];
	group: string[] | 'all';
	order: Ordering;
	limit: number | undefined;
	start: number | undefined;
	fetch: string[];
	timeout: number | undefined;
	parallel: boolean;
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
export class SelectQueryWriter<Q extends Quantity> implements GenericQueryWriter<Q> {
	
	readonly #state: SelectQueryState<Q>;

	constructor(state: SelectQueryState<Q>) {
		this.#state = state;
	}

	readonly [Generic] = true;

	get _quantity() {
		return this.#state.quantity;
	}

	get _state() {
		return Object.freeze({...this.#state});
	}

	/**
	 * Specify the targets for the query. This can include table names,
	 * record ids, and subqueries.
	 * 
	 * @param targets The targets for the query
	 * @returns The query writer
	 */
	from(...targets: SurrealValue[]) {
		const columns = targets.map(target => {
			if (typeof target === 'string' && isListLike(target)) {
				throw new CirqlWriterError('Multiple targets must be specified seperately');
			}
				
			return useSurrealValueUnsafe(target);
		});

		return this.#push({
			targets: columns.join(', ')
		});
	}

	/**
	 * Specify the target for the query as a record pointer. This function
	 * is especially useful in situations where the table name within a
	 * record pointer may be spoofed, and a specific table name is required.
	 * 
	 * @param table The table name
	 * @param id The record id, either the full id or just the unique id
	 * @returns 
	 */
	fromRecord(table: string, id: string): SelectQueryWriter<'maybe'> {
		return this.#push({
			quantity: 'maybe',
			targets: thing(table, id)
		}) as any;
	}

	/**
	 * Specify the target for the query as a relation. This function
	 * is especially useful in situations where the table names within a
	 * record pointer may be spoofed, and specific table names are required.
	 * 
	 * Since this function will automatically configure a where clause, calling
	 * `.where()` manually will throw an exception.
	 * 
	 * @param relation The relation information
	 * @param id The record id, either the full id or just the unique id
	 * @returns 
	 */
	fromRelation(relation: RecordRelation): SelectQueryWriter<'maybe'> {
		return this.#push({
			quantity: 'maybe',
			relation: true,
			targets: relation.edge,
			where: parseWhereClause({
				in: eq(raw(thing(relation.fromTable, relation.fromId))),
				out: eq(raw(thing(relation.toTable, relation.toId)))
			}),
		}) as any;
	}

	/**
	 * Define the where clause for the query. All values will be escaped
	 * automatically. Use of `raw` is supported, as well as any operators
	 * wrapping the raw function.
	 * 
	 * @param where The where clause
	 * @returns The query writer
	 */
	where(where: string|Where): SelectQueryWriter<Q> {
		if (this.#state.relation) {
			throw new CirqlWriterError('Cannot use where clause with fromRelation');
		}

		if (typeof where === 'object') {
			where = parseWhereClause(where);
		}

		return this.#push({ where });
	}

	/**
	 * Define the split fields for the query.
	 * 
	 * @param fields The split fields
	 * @returns The query writer
	 */
	split(...split: string[]): SelectQueryWriter<Q> {
		return this.#push({ split });
	}

	/**
	 * Define the fields to group by. If you are grouping by all fields, use
	 * the groupAll() method instead.
	 * 
	 * @param fields The fields to group by
	 * @returns The query writer
	 */
	groupBy(...group: string[]): SelectQueryWriter<Q> {
		return this.#push({ group });
	}

	/**
	 * Group by all fields
	 * 
	 * @returns The query writer
	 */
	groupAll(): SelectQueryWriter<Q> {
		return this.#push({ group: 'all' });
	}

	/**
	 * Define the order of the query
	 * 
	 * @param order The fields to order by
	 * @returns The query writer
	 */
	orderBy(table: string, order?: Order): SelectQueryWriter<Q>;
	orderBy(order: Ordering): SelectQueryWriter<Q>;
	orderBy(tableOrOrder: string|Ordering, order?: Order): SelectQueryWriter<Q> {
		const ordering: Ordering = typeof tableOrOrder === 'string'
			? { [tableOrOrder]: order || 'asc' }
			: tableOrOrder;

		return this.#push({
			order: ordering
		});
	}

	/**
	 * Limit the number of records returned by the query
	 * 
	 * @param limit The limit
	 * @returns The query writer
	 */
	limit(limit: number): SelectQueryWriter<'many'> {
		return this.#push({
			quantity: 'many',
			limit: limit
		}) as any;
	}

	/**
	 * Limit the number of records returned by the query to one.
	 * This is useful for queries that are expected to return
	 * a single record.
	 * 
	 * Unlike `limit(1)`, this method will cause the query to not
	 * return an array of records when executed, but instead a
	 * single record.
	 */
	one(): SelectQueryWriter<'maybe'> {
		return this.#push({
			quantity: 'maybe',
			limit: 1
		}) as any;
	}

	/**
	 * Start the query at the given index
	 * 
	 * @param start The start index
	 * @returns The query writer
	 */
	start(start: number): SelectQueryWriter<Q> {
		return this.#push({ start });
	}

	/**
	 * Define the paths to the fields to fetch
	 * 
	 * @param fields The fields to fetch
	 * @returns The query writer
	 */
	fetch(...fetch: string[]): SelectQueryWriter<Q> {
		return this.#push({ fetch });
	}

	/**
	 * Set the timeout for the query
	 * 
	 * @param seconds The timeout in seconds
	 * @returns The query writer
	 */
	timeout(timeout: number): SelectQueryWriter<Q> {
		return this.#push({ timeout });
	}

	/**
	 * Run the query in parallel
	 * 
	 * @returns The query writer
	 */
	parallel(): SelectQueryWriter<Q> {
		return this.#push({ parallel: true });
	}

	toQuery(): string {
		const {
			projections,
			targets,
			where,
			split,
			group,
			order,
			limit,
			start,
			fetch,
			timeout,
			parallel
		} = this.#state;

		if (!projections) {
			throw new Error('No projections specified');
		} else if (!targets) {
			throw new Error('No targets specified');
		}

		const orders = Object.entries(order);
		let builder = `SELECT ${projections} FROM ${targets}`;

		if (where) {
			builder += ` WHERE ${where}`;
		}

		if (split.length > 0) {
			builder += ` SPLIT ${split.join(', ')}`;
		}

		if (group === 'all') {
			builder += ' GROUP ALL';
		} else if(group.length > 0) {
			builder += ` GROUP BY ${group.join(', ')}`;
		}

		if (orders.length > 0) {
			const orderFields = orders.map(([field, direction]) => {
				return `${field} ${direction.toUpperCase()}`;
			});

			builder += ` ORDER BY ${orderFields.join(', ')}`;
		}

		if (limit) {
			builder += ` LIMIT BY ${limit}`;
		}

		if (start) {
			builder += ` START AT ${start}`;
		}

		if (fetch.length > 0) {
			builder += ` FETCH ${fetch.join(', ')}`;
		}

		if (timeout) {
			builder += ` TIMEOUT ${timeout}s`;
		}

		if (parallel) {
			builder += ' PARALLEL';
		}

		return builder;
	}

	#push<N extends Quantity = Q>(extra: Partial<SelectQueryState<N>>) {
		return new SelectQueryWriter({
			...this.#state,
			...extra
		});
	}

}

/**
 * Start a new SELECT query with the given projections. Ommitting the
 * projections will select all fields.
 * 
 * @param projections The projections to select
 * @returns The query writer
 */
export function select(...projections: string[]) {
	if (isListLike(...projections)) {
		throw new CirqlWriterError('Multiple projections must be specified seperately');
	}

	return new SelectQueryWriter({
		quantity: 'many',
		projections: projections.join(', ') || '*',
		targets: undefined,
		where: undefined,
		split: [],
		group: [],
		order: {},
		limit: undefined,
		start: undefined,
		fetch: [],
		timeout: undefined,
		parallel: false,
		relation: false
	});
}