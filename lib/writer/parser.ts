import { CirqlError } from "../errors";
import { isRaw } from "../helpers";
import { Raw } from "../raw";
import { Where } from "./types";

/**
 * Builds the SET operators for a query based on the input object
 * 
 * @param input The input object
 */
export function parseSetFields(input: object): string {
	const values: string[] = [];

	function process(obj: object, path: string) {
		Object.entries(obj).forEach(([key, value]) => {
			if (typeof value === 'object' && !Array.isArray(value)) {
				const raw = value[Raw];

				if (raw) {
					values.push(`${path}${key} ${raw}`);
				} else {
					process(value, `${path}${key}.`);
				}
			} else {
				values.push(`${path}${key} = ${JSON.stringify(value)}`);
			}
		});
	}

	process(input, '');

	return values.join(', ');
}

/**
 * Parse a where clause into a string
 * 
 * @param clause The where clause
 * @returns The string representation of the where clause
 */
export function parseWhereClause(clause: Where) {
	const keys = Object.keys(clause);
	const clauses: string[] = [];

	for (const key of keys) {
		if (key === 'OR' || key === 'AND') {
			const subValue = clause[key];
			const subClauses = [];

			if (subValue === undefined) {
				throw new CirqlError('Received expected undefined property in where clause', 'invalid_request');
			}

			for (const sub of subValue) {
				subClauses.push(`(${parseWhereClause(sub)})`);
			}

			clauses.push(`(${subClauses.join(` ${key} `)})`);
		} else {
			const value = clause[key];

			if (isRaw(value)) {
				clauses.push(`${key} ${value[Raw]}`);
			} else {
				clauses.push(`${key} = ${JSON.stringify(value)}`);
			}
		}
	}

	return clauses.join(` AND `);
}