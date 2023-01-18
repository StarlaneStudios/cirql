import { useValueOrRaw } from "../helpers";
import { RawQuery } from "../raw";
import { raw } from "./raw";

/**
 * Returns a raw query operator for `=`
 * 
 * @param value The value to check
 * @returns The raw query
 */
export function eq(value: any): RawQuery {
	return raw(`= ${useValueOrRaw(value)}`);
}

/**
 * Returns a raw query operator for `!=`
 * 
 * @param value The value to check
 * @returns The raw query
 */
export function neq(value: any): RawQuery {
	return raw(`!= ${useValueOrRaw(value)}`);
}

/**
 * Returns a raw query operator for `==`
 * 
 * @param value The value to check
 * @returns The raw query
 */
export function eeq(value: any): RawQuery {
	return raw(`== ${useValueOrRaw(value)}`);
}

/**
 * Returns a raw query operator for `?=`
 * 
 * @param value The value to check
 * @returns The raw query
 */
export function any(value: any): RawQuery {
	return raw(`?= ${useValueOrRaw(value)}`);
}

/**
 * Returns a raw query operator for `*=`
 * 
 * @param value The value to check
 * @returns The raw query
 */
export function all(value: any): RawQuery {
	return raw(`*= ${useValueOrRaw(value)}`);
}

/**
 * Returns a raw query operator for `~`
 * 
 * @param value The value to check
 * @returns The raw query
 */
export function feq(value: any): RawQuery {
	return raw(`~ ${useValueOrRaw(value)}`);
}

/**
 * Returns a raw query operator for `!~`
 * 
 * @param value The value to check
 * @returns The raw query
 */
export function nfeq(value: any): RawQuery {
	return raw(`!~ ${useValueOrRaw(value)}`);
}

/**
 * Returns a raw query operator for `?~`
 * 
 * @param value The value to check
 * @returns The raw query
 */
export function fany(value: any): RawQuery {
	return raw(`?~ ${useValueOrRaw(value)}`);
}

/**
 * Returns a raw query operator for `*~`
 * 
 * @param value The value to check
 * @returns The raw query
 */
export function fall(value: any): RawQuery {
	return raw(`*~ ${useValueOrRaw(value)}`);
}

/**
 * Returns a raw query operator for `<`
 * 
 * @param value The value to check
 * @returns The raw query
 */
export function lt(value: any): RawQuery {
	return raw(`< ${useValueOrRaw(value)}`);
}

/**
 * Returns a raw query operator for `<=`
 * 
 * @param value The value to check
 * @returns The raw query
 */
export function lte(value: any): RawQuery {
	return raw(`<= ${useValueOrRaw(value)}`);
}

/**
 * Returns a raw query operator for `>`
 * 
 * @param value The value to check
 * @returns The raw query
 */
export function gt(value: any): RawQuery {
	return raw(`> ${useValueOrRaw(value)}`);
}

/**
 * Returns a raw query operator for `>=`
 * 
 * @param value The value to check
 * @returns The raw query
 */
export function gte(value: any): RawQuery {
	return raw(`>= ${useValueOrRaw(value)}`);
}

/**
 * Returns a raw query operator for `CONTAINS`
 * 
 * @param value The value to check
 * @returns The raw query
 */
export function contains(value: any): RawQuery {
	return raw(`CONTAINS ${useValueOrRaw(value)}`);
}

/**
 * Returns a raw query operator for `CONTAINSNOT`
 * 
 * @param value The value to check
 * @returns The raw query
 */
export function containsNot(value: any): RawQuery {
	return raw(`CONTAINSNOT ${useValueOrRaw(value)}`);
}

/**
 * Returns a raw query operator for `CONTAINSALL`
 * 
 * @param value The value to check
 * @returns The raw query
 */
export function containsAll(value: any): RawQuery {
	return raw(`CONTAINSALL ${useValueOrRaw(value)}`);
}

/**
 * Returns a raw query operator for `CONTAINSANY`
 * 
 * @param value The value to check
 * @returns The raw query
 */
export function containsAny(value: any): RawQuery {
	return raw(`CONTAINSANY ${useValueOrRaw(value)}`);
}

/**
 * Returns a raw query operator for `CONTAINSNONE`
 * 
 * @param value The value to check
 * @returns The raw query
 */
export function containsNone(value: any): RawQuery {
	return raw(`CONTAINSNONE ${useValueOrRaw(value)}`);
}

/**
 * Returns a raw query operator for `INSIDE`
 * 
 * @param value The value to check
 * @returns The raw query
 */
export function inside(value: any): RawQuery {
	return raw(`INSIDE ${useValueOrRaw(value)}`);
}

/**
 * Returns a raw query operator for `NOTINSIDE`
 * 
 * @param value The value to check
 * @returns The raw query
 */
export function notInside(value: any): RawQuery {
	return raw(`NOTINSIDE ${useValueOrRaw(value)}`);
}

/**
 * Returns a raw query operator for `ALLINSIDE`
 * 
 * @param value The value to check
 * @returns The raw query
 */
export function allInside(value: any): RawQuery {
	return raw(`ALLINSIDE ${useValueOrRaw(value)}`);
}

/**
 * Returns a raw query operator for `ANYINSIDE`
 * 
 * @param value The value to check
 * @returns The raw query
 */
export function anyInside(value: any): RawQuery {
	return raw(`ANYINSIDE ${useValueOrRaw(value)}`);
}

/**
 * Returns a raw query operator for `NONEINSIDE`
 * 
 * @param value The value to check
 * @returns The raw query
 */
export function noneInside(value: any): RawQuery {
	return raw(`NONEINSIDE ${useValueOrRaw(value)}`);
}

/**
 * Returns a raw query operator for `OUTSIDE`
 * 
 * @param value The value to check
 * @returns The raw query
 */
export function outside(value: any): RawQuery {
	return raw(`OUTSIDE ${useValueOrRaw(value)}`);
}

/**
 * Returns a raw query operator for `INTERSECTS`
 * 
 * @param value The value to check
 * @returns The raw query
 */
export function intersects(value: any): RawQuery {
	return raw(`INTERSECTS ${useValueOrRaw(value)}`);
}

/**
 * Returns a raw query operator for `+=`
 * 
 * @param value The value to add
 * @returns The raw query
 */
export function add(value: any): RawQuery {
	return raw(`+= ${useValueOrRaw(value)}`);
}

/**
 * Returns a raw query operator for `-=`
 * 
 * @param value The value to remove
 * @returns The raw query
 */
export function remove(value: any): RawQuery {
	return raw(`-= ${useValueOrRaw(value)}`);
}