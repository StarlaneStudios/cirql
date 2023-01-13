export interface ConnectionDetails {

	/**
	 * The endpoint to connect to e.g. http://localhost:8000
	*/
	endpoint: string;

	/**
	 * The username to authenticate with
	 */
	username?: string;

	/**
	 * The password to authenticate with
	 */
	password?: string;

	/**
	 * The namespace to connect to
	 */
	namespace?: string;

	/**
	 * The database to connect to
	 */
	database?: string;

	/**
	 * The scope to use for the connection
	 */
	scope?: string;

	/**
	 * A JWT token to use for authentication. If this is provided, the username and password will be ignored
	 */
	token?: string;
}