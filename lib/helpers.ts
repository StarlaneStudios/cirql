import { Raw, RawQuery } from "./raw";
import { QueryWriter } from "./writer";

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
	return `type::thing(${JSON.stringify(tb)}, ${JSON.stringify(id)})`;
}

/** Generate a table query type */
export function table(tb: string) {
	return `type::table(${JSON.stringify(tb)})`;
}

/** Returns whether the given input is a raw query */
export function isRaw(input: any): input is RawQuery {
	return typeof input === 'object' && !!input[Raw]
}

/** Returns whether the given input is a query writer */
export function isWriter(input: any): input is QueryWriter<any> {
	return typeof input === 'object' && 'toQuery' in input
}

/** Returns whether any of the strings attempts to present a list */
export function isListLike(...value: string[]) {
	return value.some(v => v.includes(','));
}

/**
 * Parses the given input object into a valid query value
 * 
 * - If the input is a raw query, the raw value is returned
 * - If the input is a query writer, the final query is returned
 * - If the input is null, the string 'NONE' is returned
 * - Otherwise, the input is JSON stringified
 */
export function useValueOrRaw(value: any) {
	if (isRaw(value)) {
		return value[Raw];
	}

	if (isWriter(value)) {
		return `(${value.toQuery()})`;
	}

	return value === null ? 'NONE' : JSON.stringify(value);
}