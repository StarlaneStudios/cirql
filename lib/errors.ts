import { ZodError } from "zod";
import { QueryWriter } from "./writer/types";

export type ErrorCodes = 'no_connection' | 'invalid_query' | 'invalid_request' | 'invalid_response' | 'parse_failure' | 'too_many_results';

const formatZodError = (err: ZodError) => {
	const reports = err.errors.map(issue => {
		return `- @${issue.path.join('.')}: ${issue.message}`;
	}).join('\n');

	return reports;
};

/**
 * An error thrown during the building or execution of a Cirql query
 */
export class CirqlError extends Error {

	readonly code: ErrorCodes;

	constructor(message: string, code: ErrorCodes) {
		super(message);
		this.code = code;
	}

}

/**
 * An error thrown during the parsing of a Cirql query response
 */
export class CirqlParseError extends CirqlError {

	readonly reason: ZodError;

	constructor(message: string, reason: ZodError) {
		super(message + '\n' + formatZodError(reason), 'parse_failure');
		this.reason = reason;
	}

}

/**
 * An error thrown when a query writer is unable to generate a query
 */
export class CirqlWriterError extends CirqlError {

	readonly query?: QueryWriter;

	constructor(message: string, query?: QueryWriter) {
		super(message, 'invalid_query');
		this.query = query;
	}

}