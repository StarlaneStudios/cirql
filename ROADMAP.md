# Roadmap

- Automatic zod schema generation
	- Commandline tool to generate zod schemas from Surreal database schemas
- Add query writers for remaining statements
	- At least support `create`, `update`, `insert`, `delete`, and `relate`
- Add `relations` to .create()
	- Immediately relate a new record with existing records
- Research injection prevention strategies
	- Make query writer more intelligent and aware of variables]
	- Accompany `.toQuery()` with `.toParams()`
	- Add `.toInlineQuery()` where params are embedded
	- This is a complex topic as Cirql aims to support surreal-permission driven access but also conventional server access where clients shouldn't be able to inject unintended data (query injection, table spoofing, etc.).