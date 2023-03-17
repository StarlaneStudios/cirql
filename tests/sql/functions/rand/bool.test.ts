import { describe, expect, test } from "vitest";
import { rand } from "../../../../lib/sql/functions/rand";
import { Raw } from "../../../../lib/symbols";

describe("bool", () => {
	
	test("should return a RawQuery object with no other keys", () => {
		const rawQuery = rand.bool();
		expect(Object.getOwnPropertySymbols(rawQuery)).toEqual([Raw]);
	});

	test('should return a RawQuery object with the Raw key set to "rand::bool()"', () => {
		const rawQuery = rand.bool();
		expect(rawQuery[Raw]).toEqual("rand::bool()");
	});

	test("should always return the same RawQuery object", () => {
		const rawQuery1 = rand.bool();
		const rawQuery2 = rand.bool();
		expect(rawQuery1).toStrictEqual(rawQuery2);
	});
});
