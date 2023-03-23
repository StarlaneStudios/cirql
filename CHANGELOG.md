# Change Log

## 0.7.2 - Imporoved where
- Improved the generation of `WHERE` clauses
	- Also fixes edge cases where parenthesis were generated incorrectly
- Improved the internal implementation of `count` queries
	- Should have increased performance on large tables

## 0.7.1 - Record handling
- When selecting from a record start and limit are now ignored

## 0.7.0 - Where and setAll
- The behavior of `.where()` and `.setAll()` has been altered to work in a more consistent and expected way
	- `undefined` values are skipped
	- `null` values are converted to NONE, which in surreal represents missing values
	- `raw('null')` can be used to use JavaScript-like null values
- `.setAll()` now automatically inserts an equals sign for raw values not starting with += or -=
	This means you no longer need to wrap all raw values with `eq()` going forward
- Implemented some initial unit tests
## 0.6.8 - Setting null
- Fixed passing null to setAll throwing an error

## 0.6.6 - Date fixes
- Fixed dates not being included in CREATE and UPDATE queries

## 0.6.5 - More schema functions
- Add convenience schema functions to query writers
	- `withSchema(object)` as shortcut for `.with(z.object(object))`
	- `withAny()` as shortcut for `.with(z.any())`

## 0.6.3 - Schema fix
- Fixed schemaless queries being allowed
	- Queries should always have a shema
	- You can explicitly opt-out by using `.with(z.any())`

## 0.6.2 - Execute typings fix
- Fix return type of execute() something incorrectly being any
- Allow manually specifying type for count .where()

## 0.6.0 - Improved schema usage
- Schemas can now be defined directly on the query
	- This is done using `QueryWriter.with()`
	- Specifying the schema like this provides type completion for additional function including `.set()`, `.where()`, and more
	- The classic way of specifying the schema is still valid and required if the query contains no schema
- Allow specifying sub queries in `.where()`
	- Achieved by specifying a `QUERY` property with a two value array
	- The first value is the query writer
	- The second value is a raw query value
	- Can be used in conjunction with AND and OR
- Removed deprecated `timeNow()` function, you should instead use `time.now()`
- Removed deprecated `relateRecords()` function, you should instead use `relateRelation()`

## 0.5.7 - Bugfix
- Fixed issue where certain values could not be used as `SurrealValue`

## 0.5.6 - Select inner queries
- Added `select().addQuery(alias, writer)` to add inner queries to selections
- Support params in stateless queries

## 0.5.5 - Query writer cleanups
- Renamed and deprecated certain functions in favor of new approaches
- `select().fromRecord()`, `delRecord()`, `countRecord()`, and `updateRecord()` now support passing just a record id
	- The id will be JSON stringified to escape any potential invalid content

## 0.5.4 - New select function
- Add new `and` function to the select query writer to dynamically append projections

## 0.5.3 - Improved relations
- Improve RecordRelation type to allow SurrealValue and omitting `fromTable` and `toTable`

## 0.5.2 - Query writer improvements
- Date objects are now automaticaly converted to ISO strings in more situations
- Expose query writer state publicly as `writer._state`
- Allow raw values to be passed to more functions
	- This includes targets for `create()`, `update()`, `delete()`, etc.
	- Mostly a convenience feature, should make the API more consistent

## 0.5.1 - Group by compatibility
- For compatibility with the upcoming beta 9 and latest nightly builds `select()` and `count()` now make use of `GROUP ALL` instead of `GROUP BY ALL`
	- This may cause issues in codebases using beta 8
- Added `RecordSchema` and `EdgeSchema` exports
	- Can be used instead of `z.object()` to extend your schemas using `RecordSchema.extend({})`
	- `RecordSchema` defines the `id` field present on all records
	- `EdgeSchema` defines the `id`, `in`, and `out` fields present on all edge records

## 0.5.0 - Authentication
- Overhaul authentication support
	- Credentials are now optional when creating a new `Cirql` instance
	- Added `cirql.signIn()` to authenticate and return the session token
	- Added `cirql.signUp()` to register a new account and return the session token
	- Added `cirql.signOut()` to sign out of the current account
	- Full support for token authentication, allowing you to persist sessions
	- This is not available yet for stateless connections
- The `RawQuery` type is now exported

## 0.4.3 - Type helpers
- Added raw helper function for all `type` functions
	- Namespaced under `type`, e.g. `type.decimal()`
- Deprecated `timeNow()` as it has been replaced with `time.now()`

## 0.4.2 - Param function
- Added `param` function as shortcut for `raw('$' + name)`
- Allow query writers to be passed to operators
- Added `parseQueries` utility function

## 0.4.1 - Relation functions
- Added `updateRelation` query writer
- Added `countRelation` query writer
- Added `fromRelation` to select query writer

## 0.4.0 - Validation toggle
- Relate query writers now require a schema
	- The benefit is that created edge records are now returned
- Validation can now be disabled per query by setting the `validate` option to false
	- This is a potentially dangerous action as malformed records will not match your typings, potentially introducing bugs further down in your codebase
	- You should only disable validation if you are manually validating records
- Improved error handling for query failures in batch requests
	- All errors are now printed out at once
	- The error object now contains a `errors` property which is an array of all errors
- Deprecated `single` option as this behavior is now performed automatically
- Added `delRelation` query writer

## 0.3.2 - countRecord
- Added `countRecord` query writer
	- Primarily useful in conjunction with `.where()` to test whether a specific record matches a condition.
- Added `single` option for queries which expect a single response such as `INFO FOR DB`

## 0.3.0 - Remove classic API
- Removed the classic API
	- This was deprecated in 0.2.0
- Fixed missing TypeScript definitions

## 0.2.2 - LET Query Writer
- Implemented query writer for `LET`
- Added `cirql.ready()` for awaiting stateful connection opening
- Fixed some issues in the new API

## 0.2.0 - API Redesign
- Completely rewritten the API to be more consistent and easier to use
- Original API is still available but marked as deprecated
	- Will be removed in a future version
- Added special query writer `query()` for wrapping raw query strings
	- This is the new and only way to send raw query strings
- Added `cirql.execute()`, `cirql.batch()`, and `cirql.transaction()` which are used to execute all queries
- Added more functions to existing query writers
	- We still intend to implement writers for `LET` and `IF` soon. You can use `query()` for now.
- New API provides better runtime checking of queries and supplied schemas
- Rewritten README to reflect new API

## 0.1.11 - Required schemas
- Schemas are required for all query functions again
	- This fits better with the design goals of Cirql
	- You can still "opt-out" by setting schema to `z.any()`
- Export convinience `timeNow()` function

## 0.1.10 - Set improvements
- Ignore `undefined` values in set fields

## 0.1.9 - Field unsetting
- Convert `null` to `NONE` when passed to SET query fields
	- This allows unsetting properties using `cirql.update()`

## 0.1.8 - More query writers
- Implemented remaining query writers for `CREATE`, `UPDATE`, `DELETE`, and `RELATE`
- Restricted `queryOne` and `queryMany` to only accept `SelectQueryWriter` instead of all writers
- Delete query record id is now optional
- Update expected types for `where` fields
- Improved query writer parameters
	- Most functions now accept varargs
	- `orderBy` can now be passed a single field and ordering
- Improve `error` and `close` events
- Improve internal logic 

## 0.1.7 - Fix node compatibility
- Avoid useage of CustomEvent for `error` event as node LTS does not support it
	- Custom event is now emitted containing `code` and `reason` properties

## 0.1.6 - Improved return types
- Fixed delete operations failing
- Delete, relate, and let queries now return `Promise<undefined>`
	- This makes the typings for arrays returned by chaning more accurate

## 0.1.5 - Stateless queries
- Added support for stateless queries
	- Use the new `CirqlStateless` class
	- Same API as the main stateful `Cirql` class
- Added query function for LET statement
- Added query function for IF ELSE statement
- Refactored authentication
	- Now supports scope, namespace, database, and token authentication
- Refactored AND & OR behavior
	- Now allows for more combinations than before

## 0.1.4 - Minor fixes
- Allow array add and remove in update queries

## 0.1.2 - Query writers
- Added support for query writers
- Added retry functionality

## 0.1.1 - Refactoring
- Refactored some functions

## 0.1.0 - Initial development version
- Basic functionality only