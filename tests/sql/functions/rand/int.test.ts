import { describe, expect, test } from "vitest";
import { rand } from "../../../../lib/sql/functions/rand";
import { Raw } from "../../../../lib/symbols";

describe("int", () => {

	test("int() should return a RawQuery with rand::int()", () => {
		const rawQuery = rand.int();
		expect(rawQuery).toEqual({ [Raw]: "rand::int()" });
	});

	test("int(0, 10) should return a RawQuery with rand::int(0, 10)", () => {
		const rawQuery = rand.int(0, 10);
		expect(rawQuery).toEqual({ [Raw]: "rand::int(0, 10)" });
	});

	test("int(10, 0) should throw an error", () => {
		const rawQuery = rand.int(10, 0);
		expect(rawQuery).toEqual({ [Raw]: "rand::int(10, 0)" });
	});

	test("int(-100, -50) should return a RawQuery with rand::int(-100, -50)", () => {
		const rawQuery = rand.int(-100, -50);
		expect(rawQuery).toEqual({ [Raw]: "rand::int(-100, -50)" });
	});

	test("int(0, undefined) should return a RawQuery with rand::int()", () => {
		const rawQuery = rand.int(0, undefined);
		expect(rawQuery).toEqual({ [Raw]: "rand::int()" });
	});

	test("int(undefined, 100) should return a RawQuery with rand::int(0, 100)", () => {
		const rawQuery = rand.int(undefined, 100);
		expect(rawQuery).toEqual({ [Raw]: "rand::int()" });
	});

	test("int(-10, -10) should throw an error", () => {
		expect(() => rand.int(-10, -10)).toThrow();
	});
});
