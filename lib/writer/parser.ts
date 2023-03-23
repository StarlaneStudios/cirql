import { CirqlError } from "../errors";
import { isRaw } from "../helpers";
import { Raw } from "../symbols";
import { Schema, Where } from "./types";

const SETTER = ['=', '+=', '-='];

/**
 * Builds the SET operators for a query based on the input object
 * 
 * @param input The input object
 */
export function parseSetFields(input: object): string {
	const values: string[] = [];

	Object.entries(input).forEach(([key, value]) => {
		if (value === undefined) {
			return;
		}

		if (isRaw(value)) {
			const rawValue = value[Raw];
			const toInsert = SETTER.some(s => rawValue.startsWith(s))
				? rawValue
				: `= ${rawValue}`;

			values.push(`${key} ${toInsert}`);
		} else {
			values.push(`${key} = ${value === null ? 'NONE' : JSON.stringify(value)}`);
		}
	});

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
				const subResult = parseWhereClause(sub);

				if (subResult) {
					subClauses.push(subResult);
				}
			}

			if (subClauses.length == 0) {
				continue;
			}

			if (subClauses.length == 1) {
				clauses.push(subClauses[0]);
				continue;
			}

			clauses.push(`(${subClauses.join(` ${key} `)})`);
		} else if(key == 'QUERY') {
			const [condition, matches] = clause[key]!;

			clauses.push(`(${condition.toQuery()}) ${matches[Raw]}`);
		} else {
			const value = (clause as any)[key];

			if (value === undefined) {
				continue;
			}

			if (isRaw(value)) {
				clauses.push(`${key} ${value[Raw]}`);
			} else {
				clauses.push(`${key} = ${value === null ? 'NONE' : JSON.stringify(value)}`);
			}
		}
	}

	return clauses.join(` AND `);
}