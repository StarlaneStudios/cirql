/**
 * Template literal function used to parse a SurrealQL query
 * and escape any values passed into it.
 * 
 * @returns Escaped SurrealQL string
 */
export function surql(strings: TemplateStringsArray, ...values: any[]): string {
	return strings.reduce((acc, str, idx) =>
		acc + str + (idx < values.length ? JSON.stringify(values[idx]) : '')
	, '').trim();
}

export { surql as surrealql };