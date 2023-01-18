# Change Log

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