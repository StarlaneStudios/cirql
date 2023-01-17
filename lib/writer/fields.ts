import { Raw } from "../raw";

/**
 * Builds the SET operators for a query based on the input object
 * 
 * @param input The input object
 */
export function buildFieldMap(input: object): string {
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