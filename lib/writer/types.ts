import { ZodTypeAny } from "zod";
import { Generic, Schemaful } from "./symbols";

export type Order = 'asc' | 'desc';
export type Ordering = Record<string, Order>;
export type ReturnMode = 'none' | 'before' | 'after' | 'diff';
export type Quantity = 'zero' | 'one' | 'maybe' | 'many';

export type Where = {
	OR?: Where[];
	AND?: Where[];
} & Record<string, any>;

/**
 * The query writer interface is implemented by all query writers.
 */
export interface QueryWriter<Q extends Quantity> {

	/**
	 * The expected quantity of the query. This is used to determine whether
	 * the query writer should return a single value or an array of values.
	 * 
	 * - `zero` - The query writer should return undefined, any result is ignored
	 * - `one` - The query writer should return exactly one result, or throw an error
	 * - `maybe` - The query writer should return a single result, or null
	 * - `many` - The query writer should return an array of results
	 */
	readonly _quantity: Q;

	/**
	 * Convert the query instance to its string representation. The function
	 * invocation might fail if required query details are missing. This will
	 * cause a CirqlWriterError to be thrown.
	 */
	toQuery(): string;

	/**
	 * Transform the result of the query. This is useful for converting the
	 * result to a different format, or for performing additional validation.
	 * 
	 * @param result The original response
	 * @returns The transformed response
	 */
	_transform?(response: any[]): any[];

}

/**
 * A query writer that has no associated schema
 */
export interface GenericQueryWriter<Q extends Quantity> extends QueryWriter<Q> {
	readonly [Generic]: true;
}

/**
 * A query writer that uses a fixed schema for validation
 */
export interface SchemafulQueryWriter<S extends ZodTypeAny, Q extends Quantity> extends QueryWriter<Q> {
	readonly [Schemaful]: true;
	readonly _schema: S;
}