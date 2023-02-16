import { Order, Ordering, Where, Quantity, RecordRelation, Schema, QueryWriter } from "./types";
import { parseWhereClause } from "./parser";
import { getRelationFrom, getRelationTo, isListLike, thing, useSurrealValueUnsafe } from "../helpers";
import { CirqlWriterError } from "../errors";
import { eq } from "../sql/operators";
import { SurrealValue } from "../types";
import { ZodTypeAny } from "zod";

interface SelectQueryState<S extends Schema, Q extends Quantity> {
	schema: S;
	quantity: Q;
	projections: string[];
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
export class SelectQueryWriter<S extends Schema, Q extends Quantity> implements QueryWriter<S, Q> {
	
	readonly #state: SelectQueryState<S, Q>;

	constructor(state: SelectQueryState<S, Q>) {
		this.#state = state;
	}

	get _schema() {
		return this.#state.schema;
	}

	get _quantity() {
		return this.#state.quantity;
	}

	get _state() {
		return Object.freeze({...this.#state});
	}

	/**
	 * Define the schema that should be used to
	 * validate the query result.
	 * 
	 * @param schema The schema to use
	 * @returns The query writer
	 */
	with<NS extends ZodTypeAny>(schema: NS) {
		return new SelectQueryWriter({
			...this.#state,
			schema: schema
		});
	}

	/**
	 * Append another projection to the query. Usually it is recommended
	 * to pass projects to `select`, however in certain situations it
	 * may be useful to add additional projections to the query.
	 * 
	 * @param projection The projection to add
	 * @returns The query writer
	 */
	and(projection: string) {
		return new SelectQueryWriter({
			...this.#state,
			projections: [...this.#state.projections, projection]
		});
	}

	/**
	 * Append a subquery projection to the query. The query will be
	 * aliased with the given alias.
	 * 
	 * @param alias The alias for the subquery
	 * @param query The subquery
	 * @returns The query writer
	 */
	andQuery(alias: string, query: SelectQueryWriter<any, any>) {
		return this.and(`(${query.toQuery()}) AS ${alias}`);
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

		return new SelectQueryWriter({
			...this.#state,
			targets: columns.join(', ')
		});
	}

	/**
	 * Specify the target for the query as a record pointer.
	 * 
	 * This function automatically sets the limit to 1
	 * 
	 * @param record The record id
	 * @returns The query writer
	 */
	fromRecord(record: string): SelectQueryWriter<S, 'maybe'>

	/**
	 * Specify the target for the query as a record pointer. This function
	 * is especially useful in situations where the table name within a
	 * record pointer may be spoofed, and a specific table name is required.
	 * 
	 * This function automatically sets the limit to 1
	 * 
	 * @param table The table name
	 * @param id The record id, either the full id or just the unique id
	 * @returns The query writer
	 */
	fromRecord(table: string, id: string): SelectQueryWriter<S, 'maybe'>

	fromRecord(recordOrTable: string, id?: string) {
		return new SelectQueryWriter({
			...this.#state,
			quantity: 'maybe',
			targets: id === undefined ? JSON.stringify(recordOrTable) : thing(recordOrTable, id),
			limit: 1
		});
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
	fromRelation(relation: RecordRelation) {
		return new SelectQueryWriter({
			...this.#state,
			quantity: 'maybe',
			relation: true,
			targets: relation.edge,
			where: parseWhereClause({
				in: eq(getRelationFrom(relation)),
				out: eq(getRelationTo(relation))
			}),
		})
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
			throw new CirqlWriterError('Cannot use where clause with fromRelation');
		}

		if (typeof where === 'object') {
			where = parseWhereClause(where);
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
	split(...split: string[]) {
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
	groupBy(...group: string[]) {
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
	orderBy(table: string, order?: Order): SelectQueryWriter<S, Q>;
	orderBy(order: Ordering): SelectQueryWriter<S, Q>;
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
			quantity: 'many',
			limit: limit
		});
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
	one() {
		return new SelectQueryWriter({
			...this.#state,
			quantity: 'maybe',
			limit: 1
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
	fetch(...fetch: string[]) {
		return new SelectQueryWriter({
			...this.#state,
			fetch
		});
	}

	/**
	 * Set the timeout for the query
	 * 
	 * @param seconds The timeout in seconds
	 * @returns The query writer
	 */
	timeout(timeout: number) {
		return new SelectQueryWriter({
			...this.#state,
			timeout
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

		const what = projections.length > 0 ? projections.join(', ') : '*';
		const orders = Object.entries(order);

		let builder = `SELECT ${what} FROM ${targets}`;

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
		schema: null,
		quantity: 'many',
		projections: projections,
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