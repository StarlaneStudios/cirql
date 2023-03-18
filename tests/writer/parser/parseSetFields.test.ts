import { describe, expect, test } from "vitest";
import { time } from "../../../lib/sql/functions/time";
import { add, eq, remove } from "../../../lib/sql/operators";
import { raw } from "../../../lib/sql/raw";
import { parseSetFields } from "../../../lib/writer/parser";

describe("parseSetFields", () => {
	
	test("should work with basic values", () => {
		const result = parseSetFields({
			alpha: 'alpha',
			beta: 1,
			gamma: true,
		});

		expect(result).toEqual(`alpha = "alpha", beta = 1, gamma = true`);
	});

	test("should work with nested values", () => {
		const result = parseSetFields({
			alpha: {
				beta: true
			}
		});

		expect(result).toEqual(`alpha = {"beta":true}`);
	});

	test("should work with path seperators", () => {
		const result = parseSetFields({
			'alpha.beta': {
				gamma: true
			}
		});

		expect(result).toEqual(`alpha.beta = {"gamma":true}`);
	});

	test("should omit undefined values", () => {
		const result = parseSetFields({
			alpha: 'alpha',
			beta: undefined
		});

		expect(result).toEqual(`alpha = "alpha"`);
	});

	test("should convert null values to NONE", () => {
		const result = parseSetFields({
			alpha: 'alpha',
			beta: null
		});

		expect(result).toEqual(`alpha = "alpha", beta = NONE`);
	});

	test("should allow raw null values", () => {
		const result = parseSetFields({
			alpha: 'alpha',
			beta: eq(raw('null'))
		});

		expect(result).toEqual(`alpha = "alpha", beta = null`);
	});

	test("should insert equals when omitted", () => {
		const result = parseSetFields({
			alpha: time.now()
		});

		expect(result).toEqual(`alpha = time::now()`);
	});

	test("should allow for array modification operators", () => {
		const result = parseSetFields({
			alpha: add(true),
			beta: remove(false)
		});

		expect(result).toEqual(`alpha += true, beta -= false`);
	});

});
