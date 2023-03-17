import { describe, expect, test } from "vitest";
import { rand } from "../../../../lib/sql/functions/rand";
import { Raw } from "../../../../lib/symbols";

describe("float", () => {
	test('should return a RawQuery object with the Raw key set to "rand::float(0, 1)" by default', () => {
		const rawQuery = rand.float();
		expect(rawQuery).toEqual({ [Raw]: "rand::float(0, 1)" });
	});

	test('should return a RawQuery object with the Raw key set to "rand::float(x, y)" when given x and y arguments', () => {
		const rawQuery = rand.float(10, 20);
		expect(rawQuery).toEqual({ [Raw]: "rand::float(10, 20)" });
	});

	test("should return a RawQuery object with no other keys", () => {
		const rawQuery = rand.float();
		expect(Object.getOwnPropertySymbols(rawQuery)).toEqual([Raw]);
	});

	test("should return a RawQuery with rand::float(-1, 0)", () => {
		const rawQuery = rand.float(-1, 0);
		expect(rawQuery).toEqual({ [Raw]: "rand::float(-1, 0)" });
	});

	test("should return a RawQuery with rand::float(1, 0)", () => {
		const rawQuery = rand.float(1, 0);
		expect(rawQuery).toEqual({ [Raw]: "rand::float(1, 0)" });
	});

	test("should always return the same RawQuery object", () => {
		const rawQuery1 = rand.float();
		const rawQuery2 = rand.float();
		expect(rawQuery1).toStrictEqual(rawQuery2);
	});
});
