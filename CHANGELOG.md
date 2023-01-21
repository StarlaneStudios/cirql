# Change Log

# 0.3.0 - Remove classic API
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