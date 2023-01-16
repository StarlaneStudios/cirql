# Roadmap

- Automatic zod schema generation
	- Commandline tool to generate zod schemas from Surreal database schemas
- Add query writers for remaining statements
	- At least support `create`, `update`, `insert`, `delete`, and `relate`
- Add `relations` to .create()
	- Immediately relate a new record with existing records