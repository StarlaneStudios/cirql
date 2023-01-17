import { CirqlError, CirqlWriterError } from "../errors";
import { isRaw } from "../helpers";
import { Raw } from "../raw";
import { QueryWriter, Where } from "./types";

export type Return = 'none' | 'before' | 'after' | 'diff';

interface CreateQueryState {
	targets: string;
	setFields: object;
	content: object;
	return: Return;
	timeout: number | undefined;
	parallel: boolean;
}

/**
 * The query writer implementations for CREATE queries.
 */
export class CreateQueryWriter implements QueryWriter {
	
	readonly #state: CreateQueryState;

	constructor(state: CreateQueryState) {
		this.#state = state;
	}

	/**
	 * Set an individual field to a value
	 * 
	 * @param key The field name
	 * @param value The value
	 * @returns 
	 */
	set(key: string, value: any) {
		if (this.#hasContent()) {
			throw new CirqlWriterError('Cannot set field when content is set');
		}

		return this.#push({ 
			setFields: {
				...this.#state.setFields,
				[key]: value
			}
		});
	}

	/**
	 * Set multiple fields at once using an object. Supports 
	 * recursive objects and raw values. Can be used as effective
	 * alternative to `content`.
	 * 
	 * @param fields The object to use for setting fields
	 * @returns The query writer
	 */
	setAll(fields: object) {
		if (this.#hasContent()) {
			throw new CirqlWriterError('Cannot set fields when content is set');
		}

		return this.#push({
			setFields: {
				...this.#state.setFields,
				...fields
			} 
		});
	}

	/**
	 * Set the content for the created record. The content is
	 * serialized to JSON, meaning you can not use raw query values.
	 * 
	 * When raw values are needed, use the `setAll` function instead.
	 * 
	 * @param content The content for the record
	 * @returns The query writer
	 */
	content(content: object) {
		if (this.#hasSetFields()) {
			throw new CirqlWriterError('Cannot set content when fields are set');
		}

		return this.#push({ content });
	}

	return() {

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

	#hasSetFields() {
		return Object.keys(this.#state.setFields).length > 0;
	}

	#hasContent() {
		return Object.keys(this.#state.content).length > 0;
	}

}

/**
 * Start a new CREATE query with the given targets.
 * 
 * @param targets The targets to create
 * @returns The query writer
 */
export function create(...targets: string[]): CreateQueryWriter {
	if (targets.length === 0) {
		throw new CirqlWriterError('At least one target must be specified');
	}

	return new CreateQueryWriter({
		targets: targets.join(', '),
		setFields: {},
		content: {},
		return: 'none',
		timeout: undefined,
		parallel: false
	});
}