import { Raw, RawQuery } from "./raw";
import { QueryWriter } from "./writer/types";

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/** Generate a random id */
export function nextId(post?: string) {
	let result = '';

	for (let i = 0; i < 7; i++) {
		result += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
	}

	return post ? `${result}_${post}` : result;
}

/** Generate a thing query type */
export function thing(tb: string, id: string) {
	return `type::thing($${tb}, $${id})`;
}

/** Generate a table query type */
export function table(tb: string) {
	return `type::table($${tb})`;
}

/** Parse the input into a valid query */
export function parseQuery(query: string|QueryWriter): string {
	if (typeof query === 'string') {
		return query;
	} else {
		return query.toQuery();
	}
}

/** Returns whether the given input is a raw query */
export function isRaw(input: any): input is RawQuery {
	return typeof input === 'object' && !!input[Raw]
}

/** Returns the JSON stringified value unless it is raw */
export function useValueOrRaw(value: any) {
	return isRaw(value) ? value[Raw] : JSON.stringify(value);
}