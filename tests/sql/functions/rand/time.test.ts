import { describe, expect, test } from "vitest";
import { rand } from "../../../../lib/sql/functions/rand";
import { Raw } from "../../../../lib/symbols";

describe("time", () => {

	test('time() should return a RawQuery with rand::time()', () => {
		const rawQuery = rand.time();
		expect(rawQuery).toEqual({ [Raw]: 'rand::time()' });
	});

	test('time(0, 0) should throw an error', () => {
		expect(() => rand.time(0, 0)).toThrow();
	});

	test('time(-1, 100) should throw an error', () => {
		expect(() => rand.time(-1, 100)).toThrow();
	});

	test('time(100, -1) should throw an error', () => {
		expect(() => rand.time(100, -1)).toThrow();
	});

});