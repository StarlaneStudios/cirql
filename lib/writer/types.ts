import { ZodTypeAny } from "zod";

export type Order = 'asc' | 'desc';
export type Ordering = Record<string, Order>;
export type ReturnMode = 'none' | 'before' | 'after' | 'diff';

export type BuiltQuery<Z extends ZodTypeAny> = [string, Z];

export type Where = {
	OR?: Where[];
	AND?: Where[];
} & Record<string, any>;

/**
 * The query writer interface is implemented by all query writers.
 */
export interface QueryWriter {

	/**
	 * Convert the query instance to its string representation. The function
	 * invocation might fail if required query details are missing. This will
	 * cause a CirqlWriterError to be thrown.
	 */
	toQuery(): string;
	
}