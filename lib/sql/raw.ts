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