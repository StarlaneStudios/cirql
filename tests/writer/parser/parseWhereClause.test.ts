import { describe, expect, test } from "vitest";
import { time } from "../../../lib/sql/functions/time";
import { eq } from "../../../lib/sql/operators";
import { raw } from "../../../lib/sql/raw";
import { parseWhereClause } from "../../../lib/writer/parser";

describe("parseWhereClause", () => {
	
	test("should work with basic values", () => {
		const result = parseWhereClause({
			alpha: 'alpha',
			beta: 1,
			gamma: true,
		});

		expect(result).toEqual(`alpha = "alpha" AND beta = 1 AND gamma = true`);
	});

	test("should work with nested values", () => {
		const result = parseWhereClause({
			alpha: {
				beta: true
			}
		});

		expect(result).toEqual(`alpha = {"beta":true}`);
	});

	test("should work with path seperators", () => {
		const result = parseWhereClause({
			'alpha.beta': {
				gamma: true
			}
		});

		expect(result).toEqual(`alpha.beta = {"gamma":true}`);
	});

	test("should omit undefined values", () => {
		const result = parseWhereClause({
			alpha: 'alpha',
			beta: undefined
		});

		expect(result).toEqual(`alpha = "alpha"`);
	});

	test("should convert null values to NONE", () => {
		const result = parseWhereClause({
			alpha: 'alpha',
			beta: null
		});

		expect(result).toEqual(`alpha = "alpha" AND beta = NONE`);
	});

	test("should allow raw null values", () => {
		const result = parseWhereClause({
			alpha: 'alpha',
			beta: eq(raw('null'))
		});

		expect(result).toEqual(`alpha = "alpha" AND beta = null`);
	});

	test("should work with functions", () => {
		const result = parseWhereClause({
			alpha: eq(time.now())
		});

		expect(result).toEqual(`alpha = time::now()`);
	});

	test("should handle empty OR values", () => {
		const result = parseWhereClause({
			OR: []
		});

		expect(result).toEqual(``);
	});

	test("should handle OR conditions", () => {
		const result = parseWhereClause({
			OR: [
				{ alpha: true },
				{ alpha: false }
			]
		});

		expect(result).toEqual(`(alpha = true) OR (alpha = false)`);
	});

	test("should skip empty nested OR and AND values", () => {
		const result = parseWhereClause({
			OR: [{
				AND: [{
					OR: []
				}]
			}]
		});

		expect(result).toEqual(``);
	});

	test("should handle advanced OR and AND values", () => {
		const result = parseWhereClause({
			OR: [
				{ alpha: true },
				{
					AND: [
						{ beta: true },
						{ gamma: true }
					]
				}
			]
		});

		expect(result).toEqual(`(alpha = true) OR ((beta = true) AND (gamma = true))`);
	});

});