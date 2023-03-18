import { input, TypeOf, ZodTypeAny } from "zod";
import { RawQuery, SurrealValue } from "../types";

export type OpenUnion<T> = T | (string & {});
export type FieldOrRaw<T> = { [K in keyof T]: T[K] | RawQuery | null };

export type Order = 'asc' | 'desc';
export type Ordering = Record<string, Order>;
export type ReturnMode = 'none' | 'before' | 'after' | 'diff';
export type Quantity = 'zero' | 'one' | 'maybe' | 'many';

export type Schema = ZodTypeAny | null;
export type SchemaInput<S> = S extends ZodTypeAny ? FieldOrRaw<Omit<Partial<input<S>>, 'id'>> & { [k: string]: any } : object;
export type SchemaFields<S> = S extends ZodTypeAny ? OpenUnion<Extract<keyof input<S>, string>> : string;

export type Where<S extends Schema> = {
	OR?: Where<S>[];
	AND?: Where<S>[];
	QUERY?: [QueryWriter<any, any>, RawQuery];
} & Partial<Record<SchemaFields<S>, any>>;

/**
 * Represents a relation between two records. The relation is defined by the
 * `fromId`, `toId`, and `edge` properties.
 * 
 * If `fromTable` or `toTable` is defined, Cirql will automatically insert
 * a `type::thing()` function to constrain the ids to the specified tables,
 * which is especially useful in situations where the table names within a
 * record pointer may be spoofed, and specific table names are required.
 */
export interface RecordRelation {
	fromTable?: string;
	fromId: SurrealValue;
	edge: string;
	toTable?: string;
	toId: SurrealValue;
}

/**
 * The query writer interface is implemented by all query writers.
 */
export interface QueryWriter<S extends Schema, Q extends Quantity> {

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
	 * The schema used to validate the query input and output. If this isn't
	 * defined within the query, it but be specified for .execute().
	 */
	readonly _schema: S;

	/**
	 * If the quantity is `one`, but the query returns no results, this value
	 * will be returned instead.
	 */
	readonly _fallback?: TypeOf<S extends null ? ZodTypeAny : S>;

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