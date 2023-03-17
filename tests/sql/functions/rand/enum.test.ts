import { describe, expect, test } from "vitest";
import { rand } from "../../../../lib/sql/functions/rand";
import { Raw } from "../../../../lib/symbols";

describe("enumOf", () => {
	test("enumOf() should return a RawQuery with rand::enum()", () => {
		const rawQuery = rand.enumOf([]);
		expect(rawQuery).toEqual({ [Raw]: "rand::enum()" });
	});

	test("enumOf() should return a RawQuery with rand::enum(0, 1)", () => {
		const rawQuery = rand.enumOf([0, 1]);
		expect(rawQuery).toEqual({ [Raw]: "rand::enum(0, 1)" });
	});

	test('enumOf() should return a RawQuery with rand::enum(0, 1, "foo")', () => {
		const rawQuery = rand.enumOf([0, 1, "foo"]);
		expect(rawQuery).toEqual({ [Raw]: 'rand::enum(0, 1, "foo")' });
	});

	test('enumOf() should return a RawQuery with rand::enum(0, "foo", true)', () => {
		const rawQuery = rand.enumOf([0, "foo", true]);
		expect(rawQuery).toEqual({ [Raw]: 'rand::enum(0, "foo", true)' });
	});
});