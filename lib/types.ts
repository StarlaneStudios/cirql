import { Raw } from "./symbols";
import { QueryWriter } from "./writer";

export type RawQuery = { [Raw]: string };

export interface RootAuth {
	user: string;
	pass: string;
}

export interface NamespaceAuth {
	NS: string;
	user: string;
	pass: string;
}

export interface DatabaseAuth {
	NS: string;
	DB: string;
	user: string;
	pass: string;
}

export interface ScopeAuth {
	NS: string;
	DB: string;
	SC: string;
	[key: string]: unknown;
}

export interface TokenAuth {
	token: string;
}

export type CredentialDetails =
	| RootAuth
	| NamespaceAuth
	| DatabaseAuth
	| ScopeAuth
	| TokenAuth;

export interface ConnectionDetails {

	/**
	 * The endpoint to connect to e.g. http://localhost:8000
	*/
	endpoint: string;

	/**
	 * The namespace to connect to for executing queries
	 */
	namespace?: string;

	/**
	 * The database to connect to for executing queries
	 */
	database?: string;

}

/**
 * A value which can be used within a query. Either a
 * raw query string, a query writer, or any other value.
 */
export type SurrealValue = RawQuery | QueryWriter<any> | any;