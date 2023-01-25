import { raw } from "../raw";

/**
 * Inserts a raw function call for `time::now()`
 * 
 * @returns The raw query
 */
function now() {
	return raw('time::now()');
}

/**
 * Raw query functions for the category `time`
 */
export const time = {
	now
};