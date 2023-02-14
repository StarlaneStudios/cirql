import { type } from "./sql/functions/type";
import { raw } from "./sql/raw";
import { Raw } from "./symbols";
import { RawQuery, SurrealValue } from "./types";
import { QueryWriter, RecordRelation } from "./writer";

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

/** Resolve the from part of a relation */
export function getRelationFrom(relation: RecordRelation) {
	return relation.fromTable
		? type.thing(relation.fromTable, relation.fromId)
		: raw(useSurrealValue(relation.fromId));
}

/** Resolve the to part of a relation */
export function getRelationTo(relation: RecordRelation) {
	return relation.toTable
		? type.thing(relation.toTable, relation.toId)
		: raw(useSurrealValue(relation.toId));
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
export function isListLike(...value: SurrealValue[]) {
	return value.some(v => typeof v == 'string' && v.includes(','));
}

/**
 * Parses the given input object into a valid query value
 * 
 * - If the input is a raw query, the raw value is returned
 * - If the input is a query writer, the final query is returned
 * - If the input is null, the string 'NONE' is returned
 * - If the input is date, the ISO formatted string is returned
 * - Otherwise, the input is JSON stringified
 */
export function useSurrealValue(value: SurrealValue) {
	if (value === undefined) {
		throw new Error('Cannot use undefined value');
	}

	if (isRaw(value)) {
		return value[Raw];
	}

	if (isWriter(value)) {
		return `(${value.toQuery()})`;
	}

	if (value instanceof Date) {
		return JSON.stringify(value.toISOString());
	}

	return value === null ? 'NONE' : JSON.stringify(value);
}

/**
 * Parses the given input object into a valid query value. Unlike
 * useSurrealValue, this function does not JSON.stringify the value
 * if it is not a raw query, query writer, or date.
 * 
 * - If the input is a raw query, the raw value is returned
 * - If the input is a query writer, the final query is returned
 * - If the input is null, the string 'NONE' is returned
 * - If the input is date, the ISO formatted string is returned
 * - Otherwise, the value is directly returned
 */
export function useSurrealValueUnsafe(value: SurrealValue, wrapRaw?: boolean) {
	if (value === undefined) {
		throw new Error('Cannot use undefined value');
	}

	if (isRaw(value)) {
		return wrapRaw ? `(${value[Raw]})` : value[Raw];
	}

	if (isWriter(value)) {
		return `(${value.toQuery()})`;
	}

	if (value instanceof Date) {
		return value.toISOString();
	}

	return value === null ? 'NONE' : value;
}