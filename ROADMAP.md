# Roadmap

- Query string builders
	- Chain together functions to compose a query string without having to write any bit of SurQL.
	- Mostly useful for `selectOne()`, `selectMany()`, and existing useages of a "where" string.
	- Can be used to improve `selectOne()` and automatically set LIMIT to 1
- Automatic reconnecting functionality
	- Configurable via the options object
- Improved authentication support
	- Handle more use-cases
	- Would be good to receive community input