import { describe, expect, test } from "vitest";
import { rand } from "../../../../lib/sql/functions/rand";
import { Raw } from "../../../../lib/symbols";

describe("guid", () => {
	test("guid() should return a RawQuery with rand::guid()", () => {
		const rawQuery = rand.guid();
		expect(rawQuery).toEqual({ [Raw]: "rand::guid()" });
	});

	test("guid(8) should return a RawQuery with rand::guid(8)", () => {
		const rawQuery = rand.guid(8);
		expect(rawQuery).toEqual({ [Raw]: "rand::guid(8)" });
	});

	test("guid(16) should return a RawQuery with rand::guid(16)", () => {
		const rawQuery = rand.guid(16);
		expect(rawQuery).toEqual({ [Raw]: "rand::guid(16)" });
	});

	test("guid(undefined) should return a RawQuery with rand::guid()", () => {
		const rawQuery = rand.guid(undefined);
		expect(rawQuery).toEqual({ [Raw]: "rand::guid()" });
	});

	test("guid(0) should return a RawQuery with rand::guid()", () => {
		const rawQuery = rand.guid(0);
		expect(rawQuery).toEqual({ [Raw]: "rand::guid()" });
	});

	test("guid(-1) should return a RawQuery with rand::guid()", () => {
		const rawQuery = rand.guid(-1);
		expect(rawQuery).toEqual({ [Raw]: "rand::guid()" });
	});

	test("should always return the same RawQuery object", () => {
		const rawQuery1 = rand.guid();
		const rawQuery2 = rand.guid();
		expect(rawQuery1).toStrictEqual(rawQuery2);
	});
});
