import { CirqlWriterError } from "../errors";
import { buildFields, parseWhereClause } from "./helpers";
import { QueryWriter, ReturnMode, Where } from "./types";

type ContentMode = 'replace' | 'merge';

interface UpdateQueryState {
	targets: string;
	setFields: object;
	content: object;
	contentMode: ContentMode | undefined;
	where: string | undefined;
	returnMode: ReturnMode | 'fields' | undefined;
	returnFields: string[];
	timeout: number | undefined;
	parallel: boolean;
}

/**
 * The query writer implementations for UPDATE queries.
 * 
 * When prevention of SQL injections is important, avoid passing
 * variables to all functions except `where`, `set`, `setAll`,
 * `content`, and `merge`.
 * 
 * When using Cirql server side, never trust record ids directly
 * passed to the query writer. Always use the `updateRecord` function
 * to ensure the record id has an intended table name.
 */
export class UpdateQueryWriter implements QueryWriter {
	
	readonly #state: UpdateQueryState;

	constructor(state: UpdateQueryState) {
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
	 * Set the new content for the record. The content is
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

		return this.#push({
			content: content,
			contentMode: 'replace'
		});
	}

	/**
	 * Merge the content into the record. The content is
	 * serialized to JSON, meaning you can not use raw query values.
	 * 
	 * When raw values are needed, use the `setAll` function instead.
	 * 
	 * @param content The content for the record
	 * @returns The query writer
	 */
	merge(content: object) {
		if (this.#hasSetFields()) {
			throw new CirqlWriterError('Cannot set content when fields are set');
		}

		return this.#push({
			content: content,
			contentMode: 'merge'
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
			content,
			contentMode,
			setFields,
			where,
			returnMode,
			returnFields,
			timeout,
			parallel
		} = this.#state;

		if (!targets) {
			throw new Error('No targets specified');
		}
		
		let builder = `UPDATE ${targets}`;

		if (this.#hasSetFields()) {
			builder += ` SET ${buildFields(setFields)}`;
		} else if (this.#hasContent()) {
			const keyword = contentMode === 'merge' ? 'MERGE' : 'CONTENT';

			builder += ` ${keyword} ${JSON.stringify(content)}`;
		}

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

	#push(extra: Partial<UpdateQueryState>) {
		return new UpdateQueryWriter({
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
 * Start a new UPDATE query with the given targets.
 * 
 * @param targets The targets to update
 * @returns The query writer
 */
export function update(...targets: string[]): UpdateQueryWriter {
	if (targets.length === 0) {
		throw new CirqlWriterError('At least one target must be specified');
	}

	return new UpdateQueryWriter({
		targets: targets.join(', '),
		setFields: {},
		content: {},
		contentMode: undefined,
		where: undefined,
		returnMode: undefined,
		returnFields: [],
		timeout: undefined,
		parallel: false
	});
}

/**
 * Start a new UPDATE query for the given record. This function
 * is especially useful in situations where the table name within a
 * record pointer may be spoofed, and a specific table name is required.
 * 
 * @param table The record table
 * @param id The record id, either the full id or just the unique id
 * @returns The query writer
 */
export function updateRecord(table: string, id: string): UpdateQueryWriter {
	return update(`type::thing(${JSON.stringify(table)}, ${JSON.stringify(id)})`);
}