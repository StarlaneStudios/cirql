import { describe, test, expect } from 'vitest';
import { select } from '../../lib/writer';

describe("select", () => {
	
	test("should automatically insert *", () => {
		const query = select()
			.from('example')
			.toQuery();

		expect(query).toEqual(`SELECT * FROM example`);
	});

	test("should limit by one", () => {
		const query = select()
			.from('example')
			.one()
			.toQuery();

		expect(query).toEqual(`SELECT * FROM example LIMIT BY 1`);
	});

	test("should handle single records", () => {
		const query = select()
			.fromRecord('example:test')
			.toQuery();

		expect(query).toEqual(`SELECT * FROM example:test`);
	});

	test("should handle single records with type::thing()", () => {
		const query = select()
			.fromRecord('example', 'test')
			.toQuery();

		expect(query).toEqual(`SELECT * FROM type::thing("example", "test")`);
	});

	test("should ignore start and limit for single records", () => {
		const query = select()
			.fromRecord('example:test')
			.start(10)
			.limit(10)
			.toQuery();

		expect(query).toEqual(`SELECT * FROM example:test`);
	});

	test("should accept advanced record links", () => {
		const query = select()
			.fromRecord('example:`some escaped value`')
			.start(10)
			.limit(10)
			.toQuery();

		expect(query).toEqual('SELECT * FROM example:`some escaped value`');
	});

	test("should throw on invalid record links", () => {
		expect(() => {
			select()
				.fromRecord('example:value; SELECT * FROM dangerous')
				.start(10)
				.limit(10)
				.toQuery();
		}).toThrow();
	});

});