import { useSurrealValue } from "../../helpers";
import { SurrealValue } from "../../types";
import { raw } from "../raw";

/**
 * Inserts a raw function call for `meta::id()`
 * 
 * @param value The value to cast
 * @returns The raw query
 */
function id(value: SurrealValue) {
	return raw(`meta::id(${useSurrealValue(value)})`);
}

/**
 * Inserts a raw function call for `meta::tb()`
 * 
 * @param value The value to cast
 * @returns The raw query
 */
function tb(value: SurrealValue) {
	return raw(`meta::tb(${useSurrealValue(value)})`);
}

/**
 * Raw query functions for the category `meta`
 */
export const rand = {
    id,
    tb,
};