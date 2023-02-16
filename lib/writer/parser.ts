import { CirqlError } from "../errors";
import { isRaw } from "../helpers";
import { Raw } from "../symbols";
import { Schema, Where } from "./types";

/**
 * Builds the SET operators for a query based on the input object
 * 
 * @param input The input object
 */
export function parseSetFields(input: object): string {
	const values: string[] = [];

	function process(obj: object, path: string) {
		Object.entries(obj).forEach(([key, value]) => {
			if (value === undefined) {
				return;
			}

			if (typeof value === 'object' && !Array.isArray(value)) {
				const raw = value[Raw];

				if (raw) {
					values.push(`${path}${key} ${raw}`);
				} else {
					process(value, `${path}${key}.`);
				}
			} else {
				values.push(`${path}${key} = ${value === null ? 'NONE' : JSON.stringify(value)}`);
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
export function parseWhereClause<S extends Schema>(clause: Where<S>) {
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
		} else if(key == 'QUERY') {
			const [condition, matches] = clause[key]!;

			clauses.push(`(${condition.toQuery()}) ${matches[Raw]}`);
		} else {
			const value = (clause as any)[key];

			if (isRaw(value)) {
				clauses.push(`${key} ${value[Raw]}`);
			} else {
				clauses.push(`${key} = ${JSON.stringify(value)}`);
			}
		}
	}

	return clauses.join(` AND `);
}