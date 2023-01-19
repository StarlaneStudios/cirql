<br>

<div align="center">
    <img src="https://raw.githubusercontent.com/StarlaneStudios/cirql/main/.github/branding/logo.png">
</div>

<hr />

<br>

<p align="center">
  <a href="https://github.com/StarlaneStudios/cirql/blob/master/LICENSE">
    <img src="https://img.shields.io/github/license/StarlaneStudios/cirql"> 
  </a>
  <a href="https://discord.gg/exaQDX2">
      <img src="https://img.shields.io/discord/414532188722298881">
  </a>
  <img src="https://img.shields.io/bundlephobia/min/cirql">
  <img src="https://img.shields.io/github/contributors/StarlaneStudios/cirql">
</p>

Cirql (pronounced Circle) is a simple and lightweight ORM and query builder for [SurrealDB](https://surrealdb.com/) with built in model mapping and validation powered by [Zod](https://github.com/colinhacks/zod). Unlike most query builders, Cirql takes a very open approach, providing you with complete control over your queries.

## Features
- 🔗 Connect to SurrealDB over stateful WebSockets or stateless requests
- 📦 Support for query batching & transactions
- ⚙️ Zod-powered schema validation of query results
- 📝 Full TypeScript support with Zod schema inference
- 💎 Write flexible queries using the Query Writer API

## Notice
Cirql is still in early developmental stages. While you can use it for production applications, it may still lack specific features and edge cases. Feel free to submit feature requests or pull requests to add additional functionality to Cirql. We do ask you to please read our [Contributor Guide](CONTRIBUTING.md).

While we try to prevent making any significant API changes, we cannot guarantee this.

## Installation
The first step to use Cirql is to install the package from npm, together with a supported version of zod.
```
npm install cirql zod
```

## Getting started
### Navigation
- [Connecting to SurrealDB](#connecting-to-surrealdb)
- [String based queries](#string-based-queries)
- [Using the Query Writer API](#using-the-query-writer-api)
- [Raw query values & operators](#raw-query-values--operators)
- [Batched queries & transactions](#batched-queries--transactions)
- [Stateless requests](#stateless-requests)

### Connecting to SurrealDB
You can now instantiate a Cirql instance which will automatically attempt to connect to SurrealDB. If you require manual control over connecting you can disable auto connect in the options.

```ts
import { Cirql } from 'cirql';

const cirql = new Cirql({
    connection: {
        endpoint: 'http://localhost:8000/',
        namespace: 'test',
        database: 'test',
    },
    credentials: {
        user: 'root',
        pass: 'root',
    }
});
```

### String based queries
Once you have your cirql connection opened, you will be able to execute queries on the database. 

```ts
import { query } from 'cirql';

const profiles = await cirql.execute({ 
    query: query('SELECT * FROM profile WHERE age > $minAge'),
    schema: z.any(),
    params: {
        minAge: 42
    }
});
```

In this example we provide a raw query string, and disable validation by passing `z.any()` as the schema.

In order to prevent potential SQL injection attacks avoid inserting user-generated variables directly into raq queries. Instead, make use of Surreal's parameter functionality as demonstrated above. Using the Query Writer API will also provide safe ways to insert user-generated variables into your queries.

### Using the Query Writer API
Instead of writing queries as strings, it is recommended to use the Query Writer API. This will allow you to write queries in a more programmatic way, while still providing the same level of control as raw queries. In the following example we are also making use of Zod to validate the query results.

```ts
import { select } from 'cirql';

export const Organisation = z.object({
    id: z.string(),
    name: z.string().min(1),
    isEnabled: z.boolean(),
    createdAt: z.string()
});

const organisations = await cirql.execute({ 
    query: select().from('organisation').where({ isEnabled: true }),
    schema: Organisation
});

// organisations has full TypeScript typing based on your Zod schema

```

Thanks to Cirql's powerful type system, the `.execute()` function will automatically infer the schema from the query combined with the `schema` field. This includes changing the result type depending if you requested one or many records.

We currently provide the following query writers:
- `select()`
- `count()`
- `del()`
- `delRecord()`
- `create()`
- `createRecord()`
- `update()`
- `updateRecord()`
- `relate()`
- `relateRecords()`
- `query()`

### Raw query values & operators
While the Query Writer API provides a safe way to write queries, it is still possible to insert raw values into your queries. This can be useful for inserting SurrealDB [functions](https://github.com/StarlaneStudios/cirql/blob/main/lib/sql/functions.ts), [operators](https://github.com/StarlaneStudios/cirql/blob/main/lib/sql/operators.ts) or parameter names into `WHERE` clauses and `SET` expressions. By default values will use an equals sign (`=`).

In the following example we are creating a new organisation, and setting the `createdAt` field to the current time using the Surreal `time::now()` function.

```ts
const profile = await cirql.execute({ 
    query: create('organisation').setAll({
        name: 'Example',
        isEnabled: eq('$enable'),
        createdAt: eq(timeNow()) // time::now()
    }),
    schema: Organisation,
    params: {
        enable: true
    }
});
```

When adding or subtracting items from arrays, you can use the `add` and `remove` functions instead of eq for inserting `+=` and `-=` operators.

### Batched queries & transactions
While you can use `.execute()` to send a single query to SurrealDB, you can also use `.batch()` and `.transaction()` to send multiple queries in a single request.

The returned array will contain the results of each query in the same order as they were sent. If you are using TypeScript, the results will also be typed based on the schema you provided. You can destructure the results to get the individual values easily.

```ts
const [a, b, c, d] = await database.batch(
    {
        query: create('organisation').setAll({
            name: 'Example',
            isEnabled: eq('$enable'),
            createdAt: eq(timeNow())
        }),
        schema: Organisation,
        params: {
            enable: true
        }
    },
    {
        query: query('SELECT * FROM profile WHERE age > $minAge').single(),
        schema: Profile,
        params: {
            minAge: 42
        }
    },
    {
        query: count('organisation')
    },
    {
        query: select('id').from('organisation').where({ isEnabled: true }),
        schema: Organisation.pick({ id: true })
    }
);
```

### Stateless requests
When making requests from environments where execution times might be short lived, or where you don't need to maintain persistence between requests, you can run Cirql in stateless mode. This will cause Cirql to make individual HTTP requests for each query.

You can easily construct a stateless Cirql instance, execute a query, and discard it without having to close a connection. Keep in mind that stateless requests may take longer than stateful requests, so this is not recommended for long-running applications.

```ts
import { CirqlStateless } from 'cirql';

const cirql = new CirqlStateless({
    connection: {
        endpoint: 'http://localhost:8000/',
        namespace: 'test',
        database: 'test',
    },
    credentials: {
        user: 'root',
        pass: 'root',
    }
});

// You can now use the cirql instance as normal without
// having to call .disconnect()

const organisations = await cirql.execute({ 
    query: select().from('organisation').where({ isEnabled: true }),
    schema: Organisation
});
```

When using Cirql in a SSR environment it is safe to create a new stateless Cirql instance for each request. This will ensure that no state is shared between requests.

## Contributing
We welcome any issues and PRs submitted to Cirql. Since we currently work on multiple other projects and our time is limited, we value any community help in supporting a rich future for Cirql.

Before you open an issue or PR please read our [Contributor Guide](CONTRIBUTING.md).

### Requirements
- [PNPM](https://pnpm.io/) (npm i -g pnpm)

### Roadmap
You can find the roadmap of intended features [here](ROADMAP.md).

### Changelog
The changelog of previous versions can be found [here](CHANGELOG.md).

### Live Development
To run in live development mode, run `pnpm dev` in the project directory. This will start the Vite development server.

## Maintainers
<a href="https://starlane.studio">
  <img src="https://raw.githubusercontent.com/StarlaneStudios/cirql/main/.github/branding/starlane.png" height="64">
</a>

Cirql is built and maintained by <a href="https://starlane.studio/">Starlane Studios</a> at no cost. If you would like to support our work feel free to [donate to us](https://paypal.me/ExodiusStudios) ⚡

## License

Cirql is licensed under [MIT](LICENSE)

Copyright (c) 2023, Starlane Studios