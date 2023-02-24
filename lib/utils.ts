import { z, ZodTypeAny } from "zod";
import { QueryRequest } from "./builder/types";
import { query } from "./writer/query";

/**
 * A zod schema which matches any SurrealDB record. This schema
 * defines the `id` field as a string. You can extend this schema
 * to add additional fields to your records.
 */
export const RecordSchema = z.object({
	id: z.string()
});

/**
 * A zod schema which matches any SurrealDB edge record. This schema
 * defines the `id`, `in`, and `out` fields as strings. You can extend
 * this schema to add additional fields to your edges.
 */
export const EdgeSchema = z.object({
	id: z.string(),
	in: z.string(),
	out: z.string()
});

/**
 * Parse a string of queries into a list of query requests.
 * Each query is expected to be seperated by a semicolon. The
 * queries will be validated against `z.any()` and will not be
 * type checked.
 * 
 * You can pass the result of this function to `batch` or `transaction`.
 * 
 * Example:
 * ```ts
 * const [user, posts] = await db.batch(...parseQueries('SELECT * FROM users; SELECT * FROM posts'));
 * ```
 * 
 * @param queries A string of queries seperated by semicolons
 * @returns A list of query requests
 */
export function parseQueries(queries: string): QueryRequest<'many', ZodTypeAny>[] {
	return queries.trim().split(';').filter(q => !!q).map(q => ({
		query: query(q),
		schema: z.any()
	}));
}