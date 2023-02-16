import { QueryWriter, RecordRelation, ReturnMode, Schema, SchemaFields, SchemaInput } from "./types";
import { CirqlWriterError } from "../errors";
import { parseSetFields } from "./parser";
import { ZodTypeAny } from "zod";
import { Raw } from "../symbols";
import { getRelationFrom, getRelationTo, useSurrealValueUnsafe } from "../helpers";
import { SurrealValue } from "../types";

interface RelateQueryState<S extends Schema> {
	schema: S;
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
export class RelateQueryWriter<S extends Schema> implements QueryWriter<S, 'one'> {
	
	readonly #state: RelateQueryState<S>;

	constructor(state: RelateQueryState<S>) {
		this.#state = state;
	}

	readonly _quantity = 'one';

	get _schema() {
		return this.#state.schema;
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
		return new RelateQueryWriter({
			...this.#state,
			schema: schema
		});
	}

	/**
	 * Set an individual field to a value
	 * 
	 * @param key The field name
	 * @param value The value
	 * @returns 
	 */
	set(key: SchemaFields<S>, value: any) {
		if (this.#hasContent()) {
			throw new CirqlWriterError('Cannot set field when content is set');
		}

		return new RelateQueryWriter({
			...this.#state,
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
	setAll(fields: SchemaInput<S>) {
		if (this.#hasContent()) {
			throw new CirqlWriterError('Cannot set fields when content is set');
		}

		return new RelateQueryWriter({
			...this.#state,
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
	content(content: SchemaInput<S>) {
		if (this.#hasSetFields()) {
			throw new CirqlWriterError('Cannot set content when fields are set');
		}

		return new RelateQueryWriter({
			...this.#state,
			content
		});
	}

	/**
	 * Define the return behavior for the query
	 * 
	 * @param value The return behavior
	 * @returns The query writer
	 */
	return(mode: ReturnMode) {
		return new RelateQueryWriter({
			...this.#state,
			returnMode: mode
		});
	}
	
	/**
	 * Define the return behavior for the query
	 * 
	 * @param value The return behavior
	 * @returns The query writer
	 */
	returnFields(...fields: SchemaFields<S>[]) {
		return new RelateQueryWriter({
			...this.#state,
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
		return new RelateQueryWriter({
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
		return new RelateQueryWriter({
			...this.#state,
			parallel: true
		});
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
export function relate(from: SurrealValue, edge: string, to: SurrealValue) {
	return new RelateQueryWriter({
		schema: null,
		from: useSurrealValueUnsafe(from, true),
		edge: edge,
		to: useSurrealValueUnsafe(to, true),
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
export function relateRelation(relation: RecordRelation) {
	const from = getRelationFrom(relation);
	const to = getRelationTo(relation);

	return relate(`(${from[Raw]})`, relation.edge, `(${to[Raw]})`);
}