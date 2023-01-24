import { Raw, RawQuery } from "../raw";

/**
 * Used to insert raw values into a query
 * 
 * @param value The raw query content
 */
export function raw(value: string): RawQuery {
	return {
		[Raw]: value
	};
}

/**
 * Used to insert a raw parameter into a query
 * 
 * @param name The parameter name
 */
export function param(name: string): RawQuery {
	return raw(`$${name}`);
}