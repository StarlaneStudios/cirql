import { useSurrealValue } from "../helpers";
import { RawQuery } from "../raw";
import { SurrealValue } from "../types";
import { raw } from "./raw";

/**
 * Inserts a raw function call for `time::now()`
 * 
 * @returns The raw query
 */
export function timeNow(): RawQuery {
	return raw('time::now()');
}

/**
 * Inserts a raw function call for `type::thing()`
 * 
 * @param table The table name
 * @param id The record id
 * @returns The raw query
 */
export function typeThing(tb: SurrealValue, id: SurrealValue): RawQuery {
	return raw(`type::thing(${useSurrealValue(tb)}, ${useSurrealValue(id)})`);
}

/**
 * Inserts a raw function call for `type::table()`
 * 
 * @param table The table name
 * @returns The raw query
 */
export function typeTable(tb: SurrealValue): RawQuery {
	return raw(`type::table(${useSurrealValue(tb)})`);
}