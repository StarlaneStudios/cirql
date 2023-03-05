import { Quantity, QueryWriter, ReturnMode, Schema, SchemaFields, SchemaInput } from "./types";
import { CirqlWriterError } from "../errors";
import { parseSetFields } from "./parser";
import { isListLike, thing, useSurrealValueUnsafe } from "../helpers";
import { SurrealValue } from "../types";
import { z, ZodRawShape, ZodTypeAny } from "zod";

interface CreateQueryState<S extends Schema, Q extends Quantity> {
	schema: S;
	quantity: Q;
	targets: string;
	setFields: object;
	content: object;
	returnMode: ReturnMode | 'fields' | undefined;
	returnFields: string[];
	timeout: number | undefined;
	parallel: boolean;
}

/**
 * The query writer implementations for CREATE queries.
 * 
 * When prevention of SQL injections is important, avoid passing
 * variables to all functions except `set`, `setAll`, and `content`.
 * 
 * When using Cirql server side, never trust record ids directly
 * passed to the query writer. Always use the `createRecord` function
 * to ensure the record id has an intended table name.
 */
export class CreateQueryWriter<S extends Schema, Q extends Quantity> implements QueryWriter<S, Q> {
	
	readonly #state: CreateQueryState<S, Q>;

	constructor(state: CreateQueryState<S, Q>) {
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
		return new CreateQueryWriter({
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

		return new CreateQueryWriter({
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

		return new CreateQueryWriter({
			...this.#state,
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
	content(content: SchemaInput<S>) {
		if (this.#hasSetFields()) {
			throw new CirqlWriterError('Cannot set content when fields are set');
		}

		return new CreateQueryWriter({
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
		return new CreateQueryWriter({
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
		return new CreateQueryWriter({
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
		return new CreateQueryWriter({
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
		return new CreateQueryWriter({
			...this.#state,
			parallel: true
		});
	}

	toQuery(): string {
		const {
			targets,
			content,
			setFields,
			returnMode,
			returnFields,
			timeout,
			parallel
		} = this.#state;

		if (!targets) {
			throw new Error('No targets specified');
		}
		
		let builder = `CREATE ${targets}`;

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
 * Start a new CREATE query with the given targets.
 * 
 * @param targets The targets to create
 * @returns The query writer
 */
export function create(target: SurrealValue): CreateQueryWriter<null, 'one'>;
export function create(...targets: SurrealValue[]): CreateQueryWriter<null, 'many'>;
export function create(...targets: SurrealValue[]) {
	if (targets.length === 0) {
		throw new CirqlWriterError('At least one target must be specified');
	}

	if (isListLike(...targets)) {
		throw new CirqlWriterError('Multiple targets must be specified seperately');
	}

	return new CreateQueryWriter({
		schema: null,
		quantity: targets.length === 1 ? 'one' : 'many',
		targets: targets.map(value => useSurrealValueUnsafe(value)).join(', '),
		setFields: {},
		content: {},
		returnMode: undefined,
		returnFields: [],
		timeout: undefined,
		parallel: false
	});
}

/**
 * Start a new CREATE query for the given record. This function
 * is especially useful in situations where the table name within a
 * record pointer may be spoofed, and a specific table name is required.
 * 
 * @param table The record table
 * @param id The record id, either the full id or just the unique id
 * @returns The query writer
 */
export function createRecord(table: string, id: string) {
	return new CreateQueryWriter({
		schema: null,
		quantity: 'one',
		targets: thing(table, id),
		setFields: {},
		content: {},
		returnMode: undefined,
		returnFields: [],
		timeout: undefined,
		parallel: false
	});
}