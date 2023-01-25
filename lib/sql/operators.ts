import { useSurrealValue } from "../helpers";
import { RawQuery } from "../raw";
import { SurrealValue } from "../types";
import { raw } from "./raw";

/**
 * Returns a raw query operator for `=`
 * 
 * @param value The value to check
 * @returns The raw query
 */
export function eq(value: SurrealValue): RawQuery {
	return raw(`= ${useSurrealValue(value)}`);
}

/**
 * Returns a raw query operator for `!=`
 * 
 * @param value The value to check
 * @returns The raw query
 */
export function neq(value: SurrealValue): RawQuery {
	return raw(`!= ${useSurrealValue(value)}`);
}

/**
 * Returns a raw query operator for `==`
 * 
 * @param value The value to check
 * @returns The raw query
 */
export function eeq(value: SurrealValue): RawQuery {
	return raw(`== ${useSurrealValue(value)}`);
}

/**
 * Returns a raw query operator for `?=`
 * 
 * @param value The value to check
 * @returns The raw query
 */
export function any(value: SurrealValue): RawQuery {
	return raw(`?= ${useSurrealValue(value)}`);
}

/**
 * Returns a raw query operator for `*=`
 * 
 * @param value The value to check
 * @returns The raw query
 */
export function all(value: SurrealValue): RawQuery {
	return raw(`*= ${useSurrealValue(value)}`);
}

/**
 * Returns a raw query operator for `~`
 * 
 * @param value The value to check
 * @returns The raw query
 */
export function feq(value: SurrealValue): RawQuery {
	return raw(`~ ${useSurrealValue(value)}`);
}

/**
 * Returns a raw query operator for `!~`
 * 
 * @param value The value to check
 * @returns The raw query
 */
export function nfeq(value: SurrealValue): RawQuery {
	return raw(`!~ ${useSurrealValue(value)}`);
}

/**
 * Returns a raw query operator for `?~`
 * 
 * @param value The value to check
 * @returns The raw query
 */
export function fany(value: SurrealValue): RawQuery {
	return raw(`?~ ${useSurrealValue(value)}`);
}

/**
 * Returns a raw query operator for `*~`
 * 
 * @param value The value to check
 * @returns The raw query
 */
export function fall(value: SurrealValue): RawQuery {
	return raw(`*~ ${useSurrealValue(value)}`);
}

/**
 * Returns a raw query operator for `<`
 * 
 * @param value The value to check
 * @returns The raw query
 */
export function lt(value: SurrealValue): RawQuery {
	return raw(`< ${useSurrealValue(value)}`);
}

/**
 * Returns a raw query operator for `<=`
 * 
 * @param value The value to check
 * @returns The raw query
 */
export function lte(value: SurrealValue): RawQuery {
	return raw(`<= ${useSurrealValue(value)}`);
}

/**
 * Returns a raw query operator for `>`
 * 
 * @param value The value to check
 * @returns The raw query
 */
export function gt(value: SurrealValue): RawQuery {
	return raw(`> ${useSurrealValue(value)}`);
}

/**
 * Returns a raw query operator for `>=`
 * 
 * @param value The value to check
 * @returns The raw query
 */
export function gte(value: SurrealValue): RawQuery {
	return raw(`>= ${useSurrealValue(value)}`);
}

/**
 * Returns a raw query operator for `CONTAINS`
 * 
 * @param value The value to check
 * @returns The raw query
 */
export function contains(value: SurrealValue): RawQuery {
	return raw(`CONTAINS ${useSurrealValue(value)}`);
}

/**
 * Returns a raw query operator for `CONTAINSNOT`
 * 
 * @param value The value to check
 * @returns The raw query
 */
export function containsNot(value: SurrealValue): RawQuery {
	return raw(`CONTAINSNOT ${useSurrealValue(value)}`);
}

/**
 * Returns a raw query operator for `CONTAINSALL`
 * 
 * @param value The value to check
 * @returns The raw query
 */
export function containsAll(value: SurrealValue): RawQuery {
	return raw(`CONTAINSALL ${useSurrealValue(value)}`);
}

/**
 * Returns a raw query operator for `CONTAINSANY`
 * 
 * @param value The value to check
 * @returns The raw query
 */
export function containsAny(value: SurrealValue): RawQuery {
	return raw(`CONTAINSANY ${useSurrealValue(value)}`);
}

/**
 * Returns a raw query operator for `CONTAINSNONE`
 * 
 * @param value The value to check
 * @returns The raw query
 */
export function containsNone(value: SurrealValue): RawQuery {
	return raw(`CONTAINSNONE ${useSurrealValue(value)}`);
}

/**
 * Returns a raw query operator for `INSIDE`
 * 
 * @param value The value to check
 * @returns The raw query
 */
export function inside(value: SurrealValue): RawQuery {
	return raw(`INSIDE ${useSurrealValue(value)}`);
}

/**
 * Returns a raw query operator for `NOTINSIDE`
 * 
 * @param value The value to check
 * @returns The raw query
 */
export function notInside(value: SurrealValue): RawQuery {
	return raw(`NOTINSIDE ${useSurrealValue(value)}`);
}

/**
 * Returns a raw query operator for `ALLINSIDE`
 * 
 * @param value The value to check
 * @returns The raw query
 */
export function allInside(value: SurrealValue): RawQuery {
	return raw(`ALLINSIDE ${useSurrealValue(value)}`);
}

/**
 * Returns a raw query operator for `ANYINSIDE`
 * 
 * @param value The value to check
 * @returns The raw query
 */
export function anyInside(value: SurrealValue): RawQuery {
	return raw(`ANYINSIDE ${useSurrealValue(value)}`);
}

/**
 * Returns a raw query operator for `NONEINSIDE`
 * 
 * @param value The value to check
 * @returns The raw query
 */
export function noneInside(value: SurrealValue): RawQuery {
	return raw(`NONEINSIDE ${useSurrealValue(value)}`);
}

/**
 * Returns a raw query operator for `OUTSIDE`
 * 
 * @param value The value to check
 * @returns The raw query
 */
export function outside(value: SurrealValue): RawQuery {
	return raw(`OUTSIDE ${useSurrealValue(value)}`);
}

/**
 * Returns a raw query operator for `INTERSECTS`
 * 
 * @param value The value to check
 * @returns The raw query
 */
export function intersects(value: SurrealValue): RawQuery {
	return raw(`INTERSECTS ${useSurrealValue(value)}`);
}

/**
 * Returns a raw query operator for `+=`
 * 
 * @param value The value to add
 * @returns The raw query
 */
export function add(value: SurrealValue): RawQuery {
	return raw(`+= ${useSurrealValue(value)}`);
}

/**
 * Returns a raw query operator for `-=`
 * 
 * @param value The value to remove
 * @returns The raw query
 */
export function remove(value: SurrealValue): RawQuery {
	return raw(`-= ${useSurrealValue(value)}`);
}