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
 * always make sure of parameters to avoid potential SurSQL injection.
 */
export class SelectQueryWriter implements QueryWriter {
	
	readonly #state: SelectQueryState;

	constructor(state: SelectQueryState) {
		this.#state = state;
	}

	/**
	 * Specify the targets for the query. This can either be a table name,
	 * list of records, or a subquery.
	 * 
	 * @param targets The targets for the query
	 * @returns The query writer
	 */
	from(targets: string|string[]|QueryWriter): SelectQueryWriter {
		if (Array.isArray(targets)) {
			targets = targets.join(', ');
		} else if (typeof targets === 'object') {
			targets = `(${targets.toQuery()})`;
		}

		return new SelectQueryWriter({
			...this.#state,
			targets
		});
	}

	/**
	 * Define the where clause for the query
	 * 
	 * @param where The where clause
	 * @returns The query writer
	 */
	where(where: string|Where) {
		if (typeof where === 'object') {
			where = this.#parseWhereClause(where);	
		}

		return new SelectQueryWriter({
			...this.#state,
			where
		});
	}

	/**
	 * Define the split fields for the query.
	 * 
	 * @param fields The split fields
	 * @returns The query writer
	 */
	split(fields: string|string[]) {
		const split = Array.isArray(fields) ? fields : [fields];

		return new SelectQueryWriter({
			...this.#state,
			split
		});
	}

	/**
	 * Define the fields to group by. If you are grouping by all fields, use
	 * the groupAll() method instead.
	 * 
	 * @param fields The fields to group by
	 * @returns The query writer
	 */
	groupBy(fields: string|string[]) {
		const group = Array.isArray(fields) ? fields : [fields];

		return new SelectQueryWriter({
			...this.#state,
			group
		});
	}

	/**
	 * Group by all fields
	 * 
	 * @returns The query writer
	 */
	groupAll() {
		return new SelectQueryWriter({
			...this.#state,
			group: 'all'
		});
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

		return new SelectQueryWriter({
			...this.#state,
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
		return new SelectQueryWriter({
			...this.#state,
			limit
		});
	}

	/**
	 * Start the query at the given index
	 * 
	 * @param start The start index
	 * @returns The query writer
	 */
	start(start: number) {
		return new SelectQueryWriter({
			...this.#state,
			start
		});
	}

	/**
	 * Define the paths to the fields to fetch
	 * 
	 * @param fields The fields to fetch
	 * @returns The query writer
	 */
	fetch(fields: string | string[]) {
		const fetch = Array.isArray(fields) ? fields : [fields];

		return new SelectQueryWriter({
			...this.#state,
			fetch
		});
	}

	/**
	 * Set the timeout for the query
	 * 
	 * @param seconds The timeout in milliseconds
	 * @returns The query writer
	 */
	timeout(seconds: number) {
		return new SelectQueryWriter({
			...this.#state,
			timeout: seconds
		});
	}

	/**
	 * Run the query in parallel
	 * 
	 * @returns The query writer
	 */
	parallel() {
		return new SelectQueryWriter({
			...this.#state,
			parallel: true
		});
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
			builder += ` SPLIT AT ${split.join(', ')}`;
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
					subClauses.push(`(${this.#parseWhereClause(sub!)})`);
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

}

/**
 * Start a new SELECT query with the given projections. Ommitting the
 * projections will select all fields.
 * 
 * @param projections The projections to select
 * @returns The query writer
 */
export function select(projections?: string|string[]): SelectQueryWriter {
	if (Array.isArray(projections)) {
		projections = projections.join(', ');
	}
	
	return new SelectQueryWriter({
		projections: projections || '*',
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