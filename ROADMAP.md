# V2 Roadmap

## New methodology
- Rely on surrealdb.js as peer dependency for handling connections
- Replace query builder in favor of written query strings
- Support additional validation libraries
- Expose surql template literal tag
	- Syntax highlighting supported by the official language
	- Automatically escape interpolated values
	- Support raw values
- Focus on query utilities
	- WHERE clause generator
	- CONTENT/SET generator
- Layered approach, everything should be optional
- 