import { ZodError } from "zod";
import { QueryWriter } from "./writer/types";

export type ErrorCodes = 'no_connection' | 'invalid_query' | 'invalid_request' | 'invalid_response' | 'query_failure' | 'parse_failure' | 'too_many_results' | 'auth_failure';

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

	readonly query?: QueryWriter<any>;

	constructor(message: string, query?: QueryWriter<any>) {
		super(message, 'invalid_query');
		this.query = query;
	}

}

/**
 * An error thrown when one or more queries fail to execute successfully
 */
export class CirqlQueryError extends CirqlError {
	
	readonly errors: string[];

	constructor(errors: string[]) {
		super(`One or more queries returned a non-successful status code: \n${errors.join('\n')}`, 'query_failure');
		this.errors = errors;
	}
}

/**
 * An error thrown when authentication fails
 */
export class CirqlAuthenticationError extends CirqlError {

	constructor(message: string) {
		super(message, 'auth_failure');
	}

}