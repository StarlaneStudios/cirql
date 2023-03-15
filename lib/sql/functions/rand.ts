import { useSurrealValue } from "../../helpers";
import { SurrealValue } from "../../types";
import { raw } from "../raw";

/**
 * Inserts a raw function call for `rand::bool()`
 * 
 * @returns The raw query
 */
function bool() {
    return raw('rand::bool()');
}

/**
 * Inserts a raw function call for `rand::enum()`
 * 
 * @returns The raw query
 */
function enumOf(value: SurrealValue[]) {
	return raw(`rand::enum(${value.map(useSurrealValue).join(', ')})`);
}

/**
 * Inserts a raw function call for `rand::float()`
 * 
 * @returns The raw query
 */
function float(min: number = 0, max: number = 1) {
    return raw(`rand::float(${min}, ${max})`);
}

/**
 * Inserts a raw function call for `rand::guid()`
 * 
 * @returns The raw query
 */
function guid(length?: number) {
    if (length == undefined || length <= 0 ) {
        return raw(`rand::guid()`);
    } else {
        return raw(`rand::guid(${length})`);
    }
}

/**
 * Inserts a raw function call for `rand::int()`
 * 
 * @returns The raw query
 */
function int(min?: number, max?: number) {
    if (min || min === 0 && max || max === 0) {
        if (min == max) {
            throw new Error("Minimum and Maximum are the same!");
        } else {
            return raw(`rand::int(${min}, ${max})`);
        }
    }  else {
        return raw(`rand::int()`);
    }
}

/**
 * Inserts a raw function call for `rand::string()`
 * 
 * @returns The raw query
 */
function string(length?: number) {
    if (length >= 0 || !length) {
        return raw(`rand::string(${length ?? ""})`);
    } else {
        throw new Error("String must not be less than 0!")
    }
}

/**
 * Inserts a raw function call for `rand::time()`
 * 
 * @returns The raw query
 */
function time(minUnix?: number, maxUnix?: number) {
    if (minUnix && maxUnix) {
        return raw(`rand::time(${minUnix}, ${maxUnix})`);
    } else {
        return raw('rand::time()');
    }
}

/**
 * Inserts a raw function call for `rand::uuid()`
 * 
 * @returns The raw query
 */
function uuid() {
    return raw('rand::uuid()');
}

/**
 * Raw query functions for the category `rand`
 */
export const rand = {
    bool,
	enumOf,
	float,
	guid,
	int,
	string,
	time,
	uuid
};