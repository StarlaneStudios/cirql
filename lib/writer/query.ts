import { z, ZodTypeAny } from "zod";
import { BuiltQuery, QueryWriter } from "./types";

class PlainQueryWriter implements QueryWriter {

	readonly #query: string;

	constructor(query: string) {
		this.#query = query;
	}

	toQuery(): string {
		return this.#query;
	}

	apply<T extends ZodTypeAny = ZodTypeAny>(model?: T): BuiltQuery<T> {
		return [this.toQuery(), model || z.any() as any];
	}

}

/**
 * Create a query writer for the given raw query string
 * 
 * @param rawQuery The 
 * @returns The query writer
 */
export function query(rawQuery: string): PlainQueryWriter {
	return new PlainQueryWriter(rawQuery);
}