import { GenericQueryWriter, Quantity, ReturnMode } from "./types";
import { CirqlWriterError } from "../errors";
import { parseSetFields } from "./parser";
import { Generic } from "../symbols";
import { isListLike, thing, useSurrealValueUnsafe } from "../helpers";
import { SurrealValue } from "../types";

interface CreateQueryState<Q extends Quantity> {
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
export class CreateQueryWriter<Q extends Quantity> implements GenericQueryWriter<Q> {
	
	readonly #state: CreateQueryState<Q>;

	constructor(state: CreateQueryState<Q>) {
		this.#state = state;
	}

	readonly [Generic] = true;
	
	get _quantity() {
		return this.#state.quantity;
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

	#push<N extends Quantity = Q>(extra: Partial<CreateQueryState<N>>) {
		return new CreateQueryWriter({ ...this.#state, ...extra });
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
export function create(target: SurrealValue): CreateQueryWriter<'one'>;
export function create(...targets: SurrealValue[]): CreateQueryWriter<'many'>;
export function create(...targets: SurrealValue[]): CreateQueryWriter<'one' | 'many'> {
	if (targets.length === 0) {
		throw new CirqlWriterError('At least one target must be specified');
	}

	if (isListLike(...targets)) {
		throw new CirqlWriterError('Multiple targets must be specified seperately');
	}

	return new CreateQueryWriter({
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