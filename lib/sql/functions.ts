import { RawQuery } from "../raw";
import { raw } from "./raw";

/**
 * Inserts a raw function call for `time::now()`
 * 
 * @returns The raw query
 */
export function timeNow(): RawQuery {
	return raw('time::now()');
}