import { SchemafulQueryWriter } from "./types";
import { z, ZodUndefined } from "zod";
import { Schemaful } from "../symbols";
import { useSurrealValue } from "../helpers";
import { SurrealValue } from "../types";

const NAME_REGEX = /^[a-zA-Z0-9_]*$/;

/**
 * Create a LET query assigning the supplied value to the
 * given parameter name. The value can be any value, including
 * a raw value or another query writer.
 * 
 * @param name The parameter name
 * @param value The value, raw value, or query writer
 * @returns The query writer
 */
export function letValue(name: string, value: SurrealValue): SchemafulQueryWriter<ZodUndefined, 'zero'> {
	if (!NAME_REGEX.test(name)) {
		throw new Error(`Invalid LET name: ${name}`);
	}
	
	return {
		[Schemaful]: true,
		_quantity: 'zero',
		_schema: z.undefined(),
		toQuery() {
			return `LET $${name} = ${useSurrealValue(value)}`;
		}
	}
}