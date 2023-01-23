import { GenericQueryWriter, RecordRelation, ReturnMode } from "./types";
import { CirqlWriterError } from "../errors";
import { parseSetFields } from "./parser";
import { z } from "zod";
import { Generic } from "./symbols";
import { thing } from "../helpers";

interface RelateQueryState {
	from: string;
	edge: string;
	to: string;
	setFields: object;
	content: object;
	returnMode: ReturnMode | 'fields' | undefined;
	returnFields: string[];
	timeout: number | undefined;
	parallel: boolean;
}

/**
 * The query writer implementations for RELATE queries.
 * 
 * When prevention of SQL injections is important, avoid passing
 * variables to all functions except `set`, `setAll`, and `content`.
 * 
 * When using Cirql server side, never trust record ids directly
 * passed to the query writer. Always use the `relateRecord` function
 * to ensure the record id has an intended table name.
 */
export class RelateQueryWriter implements GenericQueryWriter<'one'> {
	
	readonly #state: RelateQueryState;

	constructor(state: RelateQueryState) {
		this.#state = state;
	}

	readonly [Generic] = true;
	readonly _schema = z.undefined();
	readonly _quantity = 'one';

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
	 * Set the content for the related record. The content is
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
			from,
			edge,
			to,
			content,
			setFields,
			returnMode,
			returnFields,
			timeout,
			parallel
		} = this.#state;

		if (!from || !edge || !to) {
			throw new Error('From, edge, and to must be defined');
		}
		
		let builder = `RELATE ${from}->${edge}->${to}`;

		if (this.#hasSetFields()) {
			const fields = parseSetFields(setFields);

			if (fields) {
				builder += ` SET ${fields}`;
			}
		} else if (this.#hasContent()) {
			builder += ` CONTENT ${JSON.stringify(content)}`;
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

	#push(extra: Partial<RelateQueryState>) {
		return new RelateQueryWriter({
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
 * Start a new RELATE query with the given targets.
 * 
 * @param from The first record
 * @param edge The edge name
 * @param to The second record
 * @returns The query writer
 */
export function relate(from: string, edge: string, to: string): RelateQueryWriter {
	return new RelateQueryWriter({
		from: from,
		edge: edge,
		to: to,
		setFields: {},
		content: {},
		returnMode: undefined,
		returnFields: [],
		timeout: undefined,
		parallel: false
	});
}

/**
 * Start a new RELATE query with the given records. This function
 * is especially useful in situations where the table name within a
 * record pointer may be spoofed, and a specific table name is required.
 * 
 * @param relation The relation information
 * @returns The query writer
 */
export function relateRecords(relation: RecordRelation): RelateQueryWriter;

/**
 * Start a new RELATE query with the given records. This function
 * is especially useful in situations where the table name within a
 * record pointer may be spoofed, and a specific table name is required.
 * 
 * @deprecated Use the `relateRecords(RecordRelation)` signature instead
 * @param fromTable The first record table
 * @param fromId The first record id, either the full id or just the unique id
 * @param edge The edge name
 * @param toTable The second record table
 * @param toId The second record id, either the full id or just the unique id
 * @returns The query writer
 */
export function relateRecords(fromTable: string, fromId: string, edge: string, toTable: string, toId: string): RelateQueryWriter;

export function relateRecords(relationOrFromTable: RecordRelation | string, fromId?: string, edge?: string, toTable?: string, toId?: string) {
	const relation = typeof relationOrFromTable === 'object'
		? relationOrFromTable : {
			fromTable: relationOrFromTable,
			fromId: fromId!,
			edge: edge!,
			toTable: toTable!,
			toId: toId!
		};

	const from = thing(relation.fromTable, relation.fromId);
	const to = thing(relation.toTable, relation.toId);

	return relate(`(${from})`, relation.edge, `(${to})`);
}