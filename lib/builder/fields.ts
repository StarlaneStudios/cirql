import { FieldMap } from "./types";
import { nextId } from "../helpers";
import { Raw } from "../raw";

/**
 * Builds the SET operators for a query based on the input object
 * 
 * @param input The input object
 */
export function buildFieldMap(input: object): FieldMap {
	const data: Record<string, any> = {};
	const changes: string[] = [];
	const pre = nextId();

	let index = 0;

	function process(obj: object, path: string) {
		Object.entries(obj).forEach(([key, value]) => {
			if (typeof value === 'object' && !Array.isArray(value)) {
				const raw = value[Raw];

				if (raw) {
					changes.push(`${path}${key} = ${raw}`);
				} else {
					process(value, `${path}${key}.`);
				}
			} else {
				const name = `${pre}${index++}`;

				changes.push(`${path}${key} = $${name}`);
				data[name] = value;
			}
		});
	}

	process(input, '');

	return {
		query: changes.join(', '),
		values: data
	};
}