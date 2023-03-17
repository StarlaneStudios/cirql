import { describe, expect, test } from "vitest";
import { rand } from "../../../../lib/sql/functions/rand";
import { Raw } from "../../../../lib/symbols";

describe("string", () => {

	test('string() should return a RawQuery with rand::string()', () => {
		const rawQuery = rand.string();
		expect(rawQuery).toEqual({ [Raw]: 'rand::string()' });
	});

	test('string(10) should return a RawQuery with rand::string(10)', () => {
		const rawQuery = rand.string(10);
		expect(rawQuery).toEqual({ [Raw]: 'rand::string(10)' });
	});

	test('string(0) should throw an error', () => {
		expect(() => rand.string(0)).toThrow();
	});

	test('string(undefined) should return rand:;string()', () => {
		const rawQuery = rand.string(undefined);
		expect(rawQuery).toEqual({ [Raw]: 'rand::string()' });
	});

	test('string(-1) should throw an error', () => {
		expect(() => rand.string(-1)).toThrow();
	});
});
