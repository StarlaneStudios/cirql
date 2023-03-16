import { describe, expect, test } from "vitest";
import { Raw } from "../../../lib/symbols";
import { rand } from "../../../lib/sql/functions/rand";
import { raw } from "../../../lib/sql/raw";

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
      expect(rawQuery).toEqual({ [Raw]: 'rand::string()'})
    });
      
    test('string(-1) should throw an error', () => {
        expect(() => rand.string(-1)).toThrow();
    });
})


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
      
})