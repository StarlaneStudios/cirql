import { CirqlError } from "../errors";
import { isRaw } from "../helpers";
import { Raw } from "../raw";
import { Order, Ordering, QueryWriter, Where } from "./types";

interface SelectQueryState {
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
export class SelectQueryWriter implements QueryWriter {
	
	readonly #state: SelectQueryState;

	constructor(state: SelectQueryState) {
		this.#state = state;
	}

	/**
	 * Specify the targets for the query. This can include table names,
	 * record ids, and subqueries.
	 * 
	 * @param targets The targets for the query
	 * @returns The query writer
	 */
	from(...targets: string[]|QueryWriter[]): SelectQueryWriter {
		const columns = targets.map(target => {
			if (typeof target === 'string') {
				return target;
			} else {
				return `(${target.toQuery()})`;
			}
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
	fromRecord(table: string, id: string): SelectQueryWriter {
		return this.#push({
			targets: `type::thing(${JSON.stringify(table)}, ${JSON.stringify(id)})`
		});
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
		if (typeof where === 'object') {
			where = this.#parseWhereClause(where);	
		}

		return this.#push({ where });
	}

	/**
	 * Define the split fields for the query.
	 * 
	 * @param fields The split fields
	 * @returns The query writer
	 */
	split(...split: string[]) {
		return this.#push({ split });
	}

	/**
	 * Define the fields to group by. If you are grouping by all fields, use
	 * the groupAll() method instead.
	 * 
	 * @param fields The fields to group by
	 * @returns The query writer
	 */
	groupBy(...group: string[]) {
		return this.#push({ group });
	}

	/**
	 * Group by all fields
	 * 
	 * @returns The query writer
	 */
	groupAll() {
		return this.#push({ group: 'all' });
	}

	/**
	 * Define the order of the query
	 * 
	 * @param order The fields to order by
	 * @returns The query writer
	 */
	orderBy(table: string, order?: Order): SelectQueryWriter;
	orderBy(order: Ordering): SelectQueryWriter;
	orderBy(tableOrOrder: string|Ordering, order?: Order) {
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
	limit(limit: number) {
		return this.#push({ limit });
	}

	/**
	 * Start the query at the given index
	 * 
	 * @param start The start index
	 * @returns The query writer
	 */
	start(start: number) {
		return this.#push({ start });
	}

	/**
	 * Define the paths to the fields to fetch
	 * 
	 * @param fields The fields to fetch
	 * @returns The query writer
	 */
	fetch(...fetch: string[]) {
		return this.#push({ fetch });
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
			builder += ' GROUP BY ALL';
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

	#parseWhereClause(clause: Where) {
		const keys = Object.keys(clause);
		const clauses: string[] = [];

		for (const key of keys) {
			if (key === 'OR' || key === 'AND') {
				const subValue = clause[key];
				const subClauses = [];

				if (subValue === undefined) {
					throw new CirqlError('Received expected undefined property in where clause', 'invalid_request');
				}

				for (const sub of subValue) {
					subClauses.push(`(${this.#parseWhereClause(sub)})`);
				}

				clauses.push(`(${subClauses.join(` ${key} `)})`);
			} else {
				const value = clause[key];

				if (isRaw(value)) {
					clauses.push(`${key} ${value[Raw]}`);
				} else {
					clauses.push(`${key} = ${JSON.stringify(value)}`);
				}
			}
		}

		return clauses.join(` AND `);
	}

	#push(extra: Partial<SelectQueryState>) {
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
export function select(...projections: string[]): SelectQueryWriter {
	return new SelectQueryWriter({
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
		parallel: false
	});
}