import { useSurrealValue } from "../../helpers";
import { RawQuery } from "../../raw";
import { SurrealValue } from "../../types";
import { raw } from "../raw";

/**
 * Inserts a raw function call for `type::bool()`
 * 
 * @param value The value to cast
 * @returns The raw query
 */
function bool(value: SurrealValue) {
	return raw(`type::bool(${useSurrealValue(value)})`);
}

/**
 * Inserts a raw function call for `type::datetime()`
 * 
 * @param value The value to cast
 * @returns The raw query
 */
function datetime(value: SurrealValue) {
	return raw(`type::datetime(${useSurrealValue(value)})`);
}

/**
 * Inserts a raw function call for `type::decimal()`
 * 
 * @param value The value to cast
 * @returns The raw query
 */
function decimal(value: SurrealValue) {
	return raw(`type::decimal(${useSurrealValue(value)})`);
}

/**
 * Inserts a raw function call for `type::duration()`
 * 
 * @param value The value to cast
 * @returns The raw query
 */
function duration(value: SurrealValue) {
	return raw(`type::duration(${useSurrealValue(value)})`);
}

/**
 * Inserts a raw function call for `type::float()`
 * 
 * @param value The value to cast
 * @returns The raw query
 */
function float(value: SurrealValue) {
	return raw(`type::float(${useSurrealValue(value)})`);
}

/**
 * Inserts a raw function call for `type::int()`
 * 
 * @param value The value to cast
 * @returns The raw query
 */
function int(value: SurrealValue) {
	return raw(`type::int(${useSurrealValue(value)})`);
}

/**
 * Inserts a raw function call for `type::number()`
 * 
 * @param value The value to cast
 * @returns The raw query
 */
function number(value: SurrealValue) {
	return raw(`type::number(${useSurrealValue(value)})`);
}

/**
 * Inserts a raw function call for `type::point()`
 * 
 * @param value The value to cast
 * @returns The raw query
 */
function point(value: SurrealValue): RawQuery

/**
 * Inserts a raw function call for `type::point()`
 * 
 * @param longitude The longitude value
 * @param latitude The latitude value
 * @returns The raw query
 */
function point(longitude: SurrealValue, latitude: SurrealValue): RawQuery

function point(valOrLon: SurrealValue, lat?: SurrealValue) {
	if (lat) {
		return raw(`type::point(${useSurrealValue(valOrLon)}, ${useSurrealValue(lat)})`);
	} else {
		return raw(`type::point(${useSurrealValue(valOrLon)})`);
	}
}

/**
 * Inserts a raw function call for `type::regex()`
 * 
 * @param value The value to cast
 * @returns The raw query
 */
function regex(value: SurrealValue) {
	return raw(`type::regex(${useSurrealValue(value)})`);
}

/**
 * Inserts a raw function call for `type::string()`
 * 
 * @param value The value to cast
 * @returns The raw query
 */
function string(value: SurrealValue) {
	return raw(`type::string(${useSurrealValue(value)})`);
}

/**
 * Inserts a raw function call for `type::table()`
 * 
 * @param table The table name
 * @returns The raw query
 */
function table(tb: SurrealValue) {
	return raw(`type::table(${useSurrealValue(tb)})`);
}

/**
 * Inserts a raw function call for `type::thing()`
 * 
 * @param table The table name
 * @param id The record id
 * @returns The raw query
 */
function thing(tb: SurrealValue, id: SurrealValue) {
	return raw(`type::thing(${useSurrealValue(tb)}, ${useSurrealValue(id)})`);
}

/**
 * Raw query functions for the category `type`
 */
export const type = {
	bool,
	datetime,
	decimal,
	duration,
	float,
	int,
	number,
	point,
	regex,
	string,
	table,
	thing
};