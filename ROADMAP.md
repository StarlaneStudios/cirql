# Roadmap

- Rework where to support array fields for AND and OR
	- The current implementation is fairly limited
- Improved authentication support
	- Handle more use-cases
	- Would be good to receive community input
- Automatic zod schema generation
	- Commandline tool to generate zod schemas from Surreal database schemas
- Add query writers for remaining statements
	- At least support `create`, `update`, `insert`, `delete`, and `relate`
- Add first class support for `LET` and `IF`