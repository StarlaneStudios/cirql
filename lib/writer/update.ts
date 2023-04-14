import { Quantity, QueryWriter, RecordRelation, ReturnMode, Schema, SchemaFields, SchemaInput, Where } from "./types";
import { parseSetFields, parseWhereClause } from "./parser";
import { CirqlWriterError } from "../errors";
import { assertRecordLink, getRelationFrom, getRelationTo, isListLike, thing, useSurrealValueUnsafe } from "../helpers";
import { eq } from "../sql/operators";
import { Patch, SurrealValue } from "../types";
import { z, ZodRawShape, ZodTypeAny } from "zod";

type ContentMode = 'replace' | 'merge' | 'patch';

const MODE_KEYWORDS = {
	replace: 'CONTENT',
	merge: 'MERGE',
	patch: 'PATCH'
}

interface UpdateQueryState<S extends Schema, Q extends Quantity> {
	schema: S;
	quantity: Q;
	targets: string;
	setFields: object;
	content: any;
	contentMode: ContentMode | undefined;
	where: string | undefined;
	returnMode: ReturnMode | 'fields' | undefined;
	returnFields: string[];
	timeout: number | undefined;
	parallel: boolean;
	relation: boolean;
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
export class UpdateQueryWriter<S extends Schema, Q extends Quantity> implements QueryWriter<S, Q> {
	
	readonly #state: UpdateQueryState<S, Q>;

	constructor(state: UpdateQueryState<S, Q>) {
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
		return new UpdateQueryWriter({
			...this.#state,
			schema: schema
		});
	}

	/**
	 * Define the schema that should be used to
	 * validate the query result. This is short
	 * for `with(z.object(schema))`.
	 * 
	 * @param schema The schema to use
	 * @returns The query writer
	 */
	withSchema<T extends ZodRawShape>(schema: T) {
		return this.with(z.object(schema));
	}

	/**
	 * Define a schema which accepts any value,
	 * useful in situations where a specific schema
	 * isn't needed. This is short for `with(z.any())`.
	 * 
	 * @returns The query writer
	 */
	withAny() {
		return this.with(z.any());
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

		return new UpdateQueryWriter({
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

		return new UpdateQueryWriter({
			...this.#state,
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
	content(content: SchemaInput<S>) {
		if (this.#hasSetFields()) {
			throw new CirqlWriterError('Cannot set content when fields are set');
		}

		return new UpdateQueryWriter({
			...this.#state,
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
	merge(content: SchemaInput<S>) {
		if (this.#hasSetFields()) {
			throw new CirqlWriterError('Cannot set content when fields are set');
		}

		return new UpdateQueryWriter({
			...this.#state,
			content: content,
			contentMode: 'merge'
		});
	}

	/**
	 * Apply the given list of patches to the record. The content is
	 * serialized to JSON, meaning you can not use raw query values.
	 * 
	 * @param patches The patches to apply
	 * @returns The query writer
	 */
	patch(patches: Patch[]) {
		if (this.#hasSetFields()) {
			throw new CirqlWriterError('Cannot set content when fields are set');
		}

		return new UpdateQueryWriter({
			...this.#state,
			content: patches,
			contentMode: 'patch'
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
	where(where: string|Where<S>) {
		if (this.#state.relation) {
			throw new CirqlWriterError('Cannot use where clause with updateRelation');
		}

		if (typeof where === 'object') {
			where = parseWhereClause(where);	
		}

		return new UpdateQueryWriter({
			...this.#state,
			where
		});
	}

	/**
	 * Define the return behavior for the query
	 * 
	 * @param value The return behavior
	 * @returns The query writer
	 */
	return(mode: ReturnMode) {
		return new UpdateQueryWriter({
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
		return new UpdateQueryWriter({
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
		return new UpdateQueryWriter({
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
		return new UpdateQueryWriter({
			...this.#state,
			parallel: true
		});
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
			const fields = parseSetFields(setFields);

			if (fields) {
				builder += ` SET ${fields}`;
			}
		} else if (this.#hasContent()) {
			const keyword = MODE_KEYWORDS[contentMode!]

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
export function update(...targets: SurrealValue[]) {
	if (targets.length === 0) {
		throw new CirqlWriterError('At least one target must be specified');
	}

	if (isListLike(...targets)) {
		throw new CirqlWriterError('Multiple targets must be specified seperately');
	}

	return new UpdateQueryWriter({
		schema: null,
		quantity: 'many',
		targets: targets.map(value => useSurrealValueUnsafe(value)).join(', '),
		setFields: {},
		content: {},
		contentMode: undefined,
		where: undefined,
		returnMode: undefined,
		returnFields: [],
		timeout: undefined,
		parallel: false,
		relation: false
	});
}

/**
 * Start a new UPDATE query for the given record. This function
 * is especially useful in situations where the table name within a
 * record pointer may be spoofed, and a specific table name is required.
 * 
 * @param record The record id
 * @returns The query writer
 */
export function updateRecord(record: string): UpdateQueryWriter<null, 'maybe'>;

/**
 * Start a new UPDATE query for the given record. This function
 * is especially useful in situations where the table name within a
 * record pointer may be spoofed, and a specific table name is required.
 * 
 * @param table The record table
 * @param id The record id, either the full id or just the unique id
 * @returns The query writer
 */
export function updateRecord(table: string, id: string): UpdateQueryWriter<null, 'maybe'>;

export function updateRecord(recordOrTable: string, id?: string) {
	return new UpdateQueryWriter({
		schema: null,
		quantity: 'maybe',
		targets: id === undefined ? assertRecordLink(recordOrTable) : thing(recordOrTable, id),
		setFields: {},
		content: {},
		contentMode: undefined,
		where: undefined,
		returnMode: undefined,
		returnFields: [],
		timeout: undefined,
		parallel: false,
		relation: false
	});
}

/**
 * Start a new UPDATE query for the given relation. This function
 * is especially useful in situations where the table names within a
 * record pointer may be spoofed, and specific table names are required.
 * 
 * Since this function will automatically configure a where clause, calling
 * `.where()` manually will throw an exception.
 * 
 * @param relation The relation information
 * @returns The query writer
 */
export function updateRelation(relation: RecordRelation) {
	return new UpdateQueryWriter({
		schema: null,
		quantity: 'maybe',
		targets: relation.edge,
		where: parseWhereClause({
			in: eq(getRelationFrom(relation)),
			out: eq(getRelationTo(relation)),
		}),
		setFields: {},
		content: {},
		contentMode: undefined,
		returnMode: undefined,
		returnFields: [],
		timeout: undefined,
		parallel: false,
		relation: true
	});
}