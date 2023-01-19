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

	readonly _quantity: Q;

	/**
	 * Convert the query instance to its string representation. The function
	 * invocation might fail if required query details are missing. This will
	 * cause a CirqlWriterError to be thrown.
	 */
	toQuery(): string;

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