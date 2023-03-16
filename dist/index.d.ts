import { ZodTypeAny, input, TypeOf, ZodRawShape, z, ZodNumber, ZodUndefined, ZodError } from 'zod';

declare const Raw: unique symbol;

type OpenUnion<T> = T | (string & {});
type FieldOrRaw<T> = {
    [K in keyof T]: T[K] | RawQuery;
};
type Order = 'asc' | 'desc';
type Ordering = Record<string, Order>;
type ReturnMode = 'none' | 'before' | 'after' | 'diff';
type Quantity = 'zero' | 'one' | 'maybe' | 'many';
type Schema = ZodTypeAny | null;
type SchemaInput<S> = S extends ZodTypeAny ? FieldOrRaw<Omit<Partial<input<S>>, 'id'>> & {
    [k: string]: any;
} : object;
type SchemaFields<S> = S extends ZodTypeAny ? OpenUnion<Extract<keyof input<S>, string>> : string;
type Where<S extends Schema> = {
    OR?: Where<S>[];
    AND?: Where<S>[];
    QUERY?: [QueryWriter<any, any>, RawQuery];
} & Partial<Record<SchemaFields<S>, any>>;
/**
 * Represents a relation between two records. The relation is defined by the
 * `fromId`, `toId`, and `edge` properties.
 *
 * If `fromTable` or `toTable` is defined, Cirql will automatically insert
 * a `type::thing()` function to constrain the ids to the specified tables,
 * which is especially useful in situations where the table names within a
 * record pointer may be spoofed, and specific table names are required.
 */
interface RecordRelation {
    fromTable?: string;
    fromId: SurrealValue;
    edge: string;
    toTable?: string;
    toId: SurrealValue;
}
/**
 * The query writer interface is implemented by all query writers.
 */
interface QueryWriter<S extends Schema, Q extends Quantity> {
    /**
     * The expected quantity of the query. This is used to determine whether
     * the query writer should return a single value or an array of values.
     *
     * - `zero` - The query writer should return undefined, any result is ignored
     * - `one` - The query writer should return exactly one result, or throw an error
     * - `maybe` - The query writer should return a single result, or null
     * - `many` - The query writer should return an array of results
     */
    readonly _quantity: Q;
    /**
     * The schema used to validate the query input and output. If this isn't
     * defined within the query, it but be specified for .execute().
     */
    readonly _schema: S;
    /**
     * If the quantity is `one`, but the query returns no results, this value
     * will be returned instead.
     */
    readonly _fallback?: TypeOf<S extends null ? ZodTypeAny : S>;
    /**
     * Convert the query instance to its string representation. The function
     * invocation might fail if required query details are missing. This will
     * cause a CirqlWriterError to be thrown.
     */
    toQuery(): string;
    /**
     * Transform the result of the query. This is useful for converting the
     * result to a different format, or for performing additional validation.
     *
     * @param result The original response
     * @returns The transformed response
     */
    _transform?(response: any[]): any[];
}

interface CreateQueryState<S extends Schema, Q extends Quantity> {
    schema: S;
    quantity: Q;
    targets: string;
    setFields: object;
    content: object;
    returnMode: ReturnMode | 'fields' | undefined;
    returnFields: string[];
    timeout: number | undefined;
    parallel: boolean;
}
/**
 * The query writer implementations for CREATE queries.
 *
 * When prevention of SQL injections is important, avoid passing
 * variables to all functions except `set`, `setAll`, and `content`.
 *
 * When using Cirql server side, never trust record ids directly
 * passed to the query writer. Always use the `createRecord` function
 * to ensure the record id has an intended table name.
 */
declare class CreateQueryWriter<S extends Schema, Q extends Quantity> implements QueryWriter<S, Q> {
    #private;
    constructor(state: CreateQueryState<S, Q>);
    get _schema(): S;
    get _quantity(): Q;
    get _state(): Readonly<{
        schema: S;
        quantity: Q;
        targets: string;
        setFields: object;
        content: object;
        returnMode: ReturnMode | "fields" | undefined;
        returnFields: string[];
        timeout: number | undefined;
        parallel: boolean;
    }>;
    /**
     * Define the schema that should be used to
     * validate the query result.
     *
     * @param schema The schema to use
     * @returns The query writer
     */
    with<NS extends ZodTypeAny>(schema: NS): CreateQueryWriter<NS, Q>;
    /**
     * Define the schema that should be used to
     * validate the query result. This is short
     * for `with(z.object(schema))`.
     *
     * @param schema The schema to use
     * @returns The query writer
     */
    withSchema<T extends ZodRawShape>(schema: T): CreateQueryWriter<z.ZodObject<T, "strip", z.ZodTypeAny, z.objectUtil.addQuestionMarks<{ [k_2 in keyof T]: T[k_2]["_output"]; }> extends infer T_1 ? { [k_1 in keyof T_1]: z.objectUtil.addQuestionMarks<{ [k in keyof T]: T[k]["_output"]; }>[k_1]; } : never, z.objectUtil.addQuestionMarks<{ [k_2_1 in keyof T]: T[k_2_1]["_input"]; }> extends infer T_2 ? { [k_3 in keyof T_2]: z.objectUtil.addQuestionMarks<{ [k_2 in keyof T]: T[k_2]["_input"]; }>[k_3]; } : never>, Q>;
    /**
     * Define a schema which accepts any value,
     * useful in situations where a specific schema
     * isn't needed. This is short for `with(z.any())`.
     *
     * @returns The query writer
     */
    withAny(): CreateQueryWriter<z.ZodAny, Q>;
    /**
     * Set an individual field to a value
     *
     * @param key The field name
     * @param value The value
     * @returns
     */
    set(key: SchemaFields<S>, value: any): CreateQueryWriter<S, Q>;
    /**
     * Set multiple fields at once using an object. Supports
     * recursive objects and raw values. Can be used as effective
     * alternative to `content`.
     *
     * @param fields The object to use for setting fields
     * @returns The query writer
     */
    setAll(fields: SchemaInput<S>): CreateQueryWriter<S, Q>;
    /**
     * Set the content for the created record. The content is
     * serialized to JSON, meaning you can not use raw query values.
     *
     * When raw values are needed, use the `setAll` function instead.
     *
     * @param content The content for the record
     * @returns The query writer
     */
    content(content: SchemaInput<S>): CreateQueryWriter<S, Q>;
    /**
     * Define the return behavior for the query
     *
     * @param value The return behavior
     * @returns The query writer
     */
    return(mode: ReturnMode): CreateQueryWriter<S, Q>;
    /**
     * Define the return behavior for the query
     *
     * @param value The return behavior
     * @returns The query writer
     */
    returnFields(...fields: SchemaFields<S>[]): CreateQueryWriter<S, Q>;
    /**
     * Set the timeout for the query
     *
     * @param seconds The timeout in seconds
     * @returns The query writer
     */
    timeout(timeout: number): CreateQueryWriter<S, Q>;
    /**
     * Run the query in parallel
     *
     * @returns The query writer
     */
    parallel(): CreateQueryWriter<S, Q>;
    toQuery(): string;
}
/**
 * Start a new CREATE query with the given targets.
 *
 * @param targets The targets to create
 * @returns The query writer
 */
declare function create(target: SurrealValue): CreateQueryWriter<null, 'one'>;
declare function create(...targets: SurrealValue[]): CreateQueryWriter<null, 'many'>;
/**
 * Start a new CREATE query for the given record. This function
 * is especially useful in situations where the table name within a
 * record pointer may be spoofed, and a specific table name is required.
 *
 * @param table The record table
 * @param id The record id, either the full id or just the unique id
 * @returns The query writer
 */
declare function createRecord(table: string, id: string): CreateQueryWriter<null, "one">;

interface CountQueryState {
    target: string;
    where: string | undefined;
    relation: boolean;
}
/**
 * The query writer implementations for SELECT queries. Remember to
 * always make sure of parameters to avoid potential SQL injection.
 *
 * When prevention of SQL injections is important, avoid passing
 * variables to all functions except `where`.
 *
 * When using Cirql server side, never trust record ids directly
 * passed to the query writer. Always use the `fromRecord` function
 * to ensure the record id has an intended table name.
 */
declare class CountQueryWriter implements QueryWriter<ZodNumber, 'one'> {
    #private;
    constructor(state: CountQueryState);
    readonly _fallback = 0;
    readonly _schema: z.ZodNumber;
    readonly _quantity = "one";
    get _state(): Readonly<{
        target: string;
        where: string | undefined;
        relation: boolean;
    }>;
    /**
     * Define the where clause for the query. All values will be escaped
     * automatically. Use of `raw` is supported, as well as any operators
     * wrapping the raw function.
     *
     * @param where The where clause
     * @returns The query writer
     */
    where<T extends Schema = null>(where: string | Where<T>): CountQueryWriter;
    toQuery(): string;
    _transform(response: any[]): any[];
}
/**
 * Start a new count query which will return the amount of
 * rows in a given table. You can either pass a table name or
 * pass a record id in conjunction with `.where()` to test
 * whether a specific record exists.
 *
 * @param target The target table
 * @returns The query writer
 */
declare function count(target: SurrealValue): CountQueryWriter;
/**
 * Start a new count query restricted to the given record. This
 * is only useful in conjunction with `.where()` in order to
 * test whether a specific record matches a given condition.
 *
 * @param record The record id
 * @returns The query writer
 */
declare function countRecord(record: string): CountQueryWriter;
/**
 * Start a new count query restricted to the given record. This
 * is only useful in conjunction with `.where()` in order to
 * test whether a specific record matches a given condition.
 *
 * @param table The record table
 * @param id The record id, either the full id or just the unique id
 * @returns The query writer
 */
declare function countRecord(table: string, id: string): CountQueryWriter;
/**
 * Start a new count query restricted to the given relation. This
 * is only useful to test whether a specific relation exists.
 *
 * Since this function will automatically configure a where clause, calling
 * `.where()` manually will throw an exception.
 *
 * @param relation The relation information
 * @returns The query writer
 */
declare function countRelation(relation: RecordRelation): CountQueryWriter;

interface DeleteQueryState<S extends Schema, Q extends Quantity> {
    schema: S;
    quantity: Q;
    targets: string;
    where: string | undefined;
    returnMode: ReturnMode | 'fields' | undefined;
    returnFields: string[];
    timeout: number | undefined;
    parallel: boolean;
    unrelate: boolean;
}
/**
 * The query writer implementations for DELETE queries.
 *
 * When prevention of SQL injections is important, avoid passing
 * variables to all functions except `where`.
 *
 * When using Cirql server side, never trust record ids directly
 * passed to the query writer. Always use the `deleteRecord` function
 * to ensure the record id has an intended table name.
 */
declare class DeleteQueryWriter<S extends Schema, Q extends Quantity> implements QueryWriter<S, Q> {
    #private;
    constructor(state: DeleteQueryState<S, Q>);
    get _schema(): S;
    get _quantity(): Q;
    get _state(): Readonly<{
        schema: S;
        quantity: Q;
        targets: string;
        where: string | undefined;
        returnMode: ReturnMode | "fields" | undefined;
        returnFields: string[];
        timeout: number | undefined;
        parallel: boolean;
        unrelate: boolean;
    }>;
    /**
     * Define the schema that should be used to
     * validate the query result.
     *
     * @param schema The schema to use
     * @returns The query writer
     */
    with<NS extends ZodTypeAny>(schema: NS): DeleteQueryWriter<NS, Q>;
    /**
     * Define the schema that should be used to
     * validate the query result. This is short
     * for `with(z.object(schema))`.
     *
     * @param schema The schema to use
     * @returns The query writer
     */
    withSchema<T extends ZodRawShape>(schema: T): DeleteQueryWriter<z.ZodObject<T, "strip", z.ZodTypeAny, z.objectUtil.addQuestionMarks<{ [k_2 in keyof T]: T[k_2]["_output"]; }> extends infer T_1 ? { [k_1 in keyof T_1]: z.objectUtil.addQuestionMarks<{ [k in keyof T]: T[k]["_output"]; }>[k_1]; } : never, z.objectUtil.addQuestionMarks<{ [k_2_1 in keyof T]: T[k_2_1]["_input"]; }> extends infer T_2 ? { [k_3 in keyof T_2]: z.objectUtil.addQuestionMarks<{ [k_2 in keyof T]: T[k_2]["_input"]; }>[k_3]; } : never>, Q>;
    /**
     * Define a schema which accepts any value,
     * useful in situations where a specific schema
     * isn't needed. This is short for `with(z.any())`.
     *
     * @returns The query writer
     */
    withAny(): DeleteQueryWriter<z.ZodAny, Q>;
    /**
     * Define the where clause for the query. All values will be escaped
     * automatically. Use of `raw` is supported, as well as any operators
     * wrapping the raw function.
     *
     * @param where The where clause
     * @returns The query writer
     */
    where(where: string | Where<S>): DeleteQueryWriter<S, Q>;
    /**
     * Define the return behavior for the query
     *
     * @param value The return behavior
     * @returns The query writer
     */
    return(mode: ReturnMode): DeleteQueryWriter<S, Q>;
    /**
     * Define the return behavior for the query
     *
     * @param value The return behavior
     * @returns The query writer
     */
    returnFields(...fields: SchemaFields<S>[]): DeleteQueryWriter<S, Q>;
    /**
     * Set the timeout for the query
     *
     * @param seconds The timeout in seconds
     * @returns The query writer
     */
    timeout(timeout: number): DeleteQueryWriter<S, Q>;
    /**
     * Run the query in parallel
     *
     * @returns The query writer
     */
    parallel(): DeleteQueryWriter<S, Q>;
    toQuery(): string;
}
/**
 * Start a new DELETE query with the given targets. Since delete
 * is a reserved word in JavaScript, this function is named `del`.
 *
 * If you only want to delete one record, use the `delRecord` function.
 *
 * @param targets The targets to delete
 * @returns The query writer
 */
declare function del(...targets: SurrealValue[]): DeleteQueryWriter<null, "many">;
/**
 * Start a new DELETE query for the given record.
 *
 * @param record The record id
 * @returns The query writer
 */
declare function delRecord(record: string): DeleteQueryWriter<null, 'maybe'>;
/**
 * Start a new DELETE query for the given record. This function
 * is especially useful in situations where the table name within a
 * record pointer may be spoofed, and a specific table name is required.
 *
 * @param table The record table
 * @param id The record id, either the full id or just the unique id
 * @returns The query writer
 */
declare function delRecord(table: string, id: string): DeleteQueryWriter<null, 'maybe'>;
/**
 * Start a new DELETE query that deletes the given relation. Since this
 * function will automatically configure a where clause, calling `.where()`
 * manually will throw an exception.
 *
 * @param relation The relation information
 * @returns The query writer
 */
declare function delRelation(relation: RecordRelation): DeleteQueryWriter<null, "maybe">;

interface RelateQueryState<S extends Schema> {
    schema: S;
    from: string;
    edge: string;
    to: string;
    setFields: object;
    content: object;
    returnMode: ReturnMode | 'fields' | undefined;
    returnFields: string[];
    timeout: number | undefined;
    parallel: boolean;
}
/**
 * The query writer implementations for RELATE queries.
 *
 * When prevention of SQL injections is important, avoid passing
 * variables to all functions except `set`, `setAll`, and `content`.
 *
 * When using Cirql server side, never trust record ids directly
 * passed to the query writer. Always use the `relateRecord` function
 * to ensure the record id has an intended table name.
 */
declare class RelateQueryWriter<S extends Schema> implements QueryWriter<S, 'one'> {
    #private;
    constructor(state: RelateQueryState<S>);
    readonly _quantity = "one";
    get _schema(): S;
    get _state(): Readonly<{
        schema: S;
        from: string;
        edge: string;
        to: string;
        setFields: object;
        content: object;
        returnMode: ReturnMode | "fields" | undefined;
        returnFields: string[];
        timeout: number | undefined;
        parallel: boolean;
    }>;
    /**
     * Define the schema that should be used to
     * validate the query result.
     *
     * @param schema The schema to use
     * @returns The query writer
     */
    with<NS extends ZodTypeAny>(schema: NS): RelateQueryWriter<NS>;
    /**
     * Define the schema that should be used to
     * validate the query result. This is short
     * for `with(z.object(schema))`.
     *
     * @param schema The schema to use
     * @returns The query writer
     */
    withSchema<T extends ZodRawShape>(schema: T): RelateQueryWriter<z.ZodObject<T, "strip", z.ZodTypeAny, z.objectUtil.addQuestionMarks<{ [k_2 in keyof T]: T[k_2]["_output"]; }> extends infer T_1 ? { [k_1 in keyof T_1]: z.objectUtil.addQuestionMarks<{ [k in keyof T]: T[k]["_output"]; }>[k_1]; } : never, z.objectUtil.addQuestionMarks<{ [k_2_1 in keyof T]: T[k_2_1]["_input"]; }> extends infer T_2 ? { [k_3 in keyof T_2]: z.objectUtil.addQuestionMarks<{ [k_2 in keyof T]: T[k_2]["_input"]; }>[k_3]; } : never>>;
    /**
     * Define a schema which accepts any value,
     * useful in situations where a specific schema
     * isn't needed. This is short for `with(z.any())`.
     *
     * @returns The query writer
     */
    withAny(): RelateQueryWriter<z.ZodAny>;
    /**
     * Set an individual field to a value
     *
     * @param key The field name
     * @param value The value
     * @returns
     */
    set(key: SchemaFields<S>, value: any): RelateQueryWriter<S>;
    /**
     * Set multiple fields at once using an object. Supports
     * recursive objects and raw values. Can be used as effective
     * alternative to `content`.
     *
     * @param fields The object to use for setting fields
     * @returns The query writer
     */
    setAll(fields: SchemaInput<S>): RelateQueryWriter<S>;
    /**
     * Set the content for the related record. The content is
     * serialized to JSON, meaning you can not use raw query values.
     *
     * When raw values are needed, use the `setAll` function instead.
     *
     * @param content The content for the record
     * @returns The query writer
     */
    content(content: SchemaInput<S>): RelateQueryWriter<S>;
    /**
     * Define the return behavior for the query
     *
     * @param value The return behavior
     * @returns The query writer
     */
    return(mode: ReturnMode): RelateQueryWriter<S>;
    /**
     * Define the return behavior for the query
     *
     * @param value The return behavior
     * @returns The query writer
     */
    returnFields(...fields: SchemaFields<S>[]): RelateQueryWriter<S>;
    /**
     * Set the timeout for the query
     *
     * @param seconds The timeout in seconds
     * @returns The query writer
     */
    timeout(timeout: number): RelateQueryWriter<S>;
    /**
     * Run the query in parallel
     *
     * @returns The query writer
     */
    parallel(): RelateQueryWriter<S>;
    toQuery(): string;
}
/**
 * Start a new RELATE query with the given targets.
 *
 * @param from The first record
 * @param edge The edge name
 * @param to The second record
 * @returns The query writer
 */
declare function relate(from: SurrealValue, edge: string, to: SurrealValue): RelateQueryWriter<null>;
/**
 * Start a new RELATE query with the given records. This function
 * is especially useful in situations where the table name within a
 * record pointer may be spoofed, and a specific table name is required.
 *
 * @param relation The relation information
 * @returns The query writer
 */
declare function relateRelation(relation: RecordRelation): RelateQueryWriter<null>;

interface SelectQueryState<S extends Schema, Q extends Quantity> {
    schema: S;
    quantity: Q;
    projections: string[];
    targets: string | undefined;
    where: string | undefined;
    split: string[];
    group: string[] | 'all';
    order: Ordering;
    limit: number | undefined;
    start: number | undefined;
    fetch: string[];
    timeout: number | undefined;
    parallel: boolean;
    relation: boolean;
}
/**
 * The query writer implementations for SELECT queries. Remember to
 * always make sure of parameters to avoid potential SQL injection.
 *
 * When prevention of SQL injections is important, avoid passing
 * variables to all functions except `where`.
 *
 * When using Cirql server side, never trust record ids directly
 * passed to the query writer. Always use the `fromRecord` function
 * to ensure the record id has an intended table name.
 */
declare class SelectQueryWriter<S extends Schema, Q extends Quantity> implements QueryWriter<S, Q> {
    #private;
    constructor(state: SelectQueryState<S, Q>);
    get _schema(): S;
    get _quantity(): Q;
    get _state(): Readonly<{
        schema: S;
        quantity: Q;
        projections: string[];
        targets: string | undefined;
        where: string | undefined;
        split: string[];
        group: string[] | "all";
        order: Ordering;
        limit: number | undefined;
        start: number | undefined;
        fetch: string[];
        timeout: number | undefined;
        parallel: boolean;
        relation: boolean;
    }>;
    /**
     * Define the schema that should be used to
     * validate the query result.
     *
     * @param schema The schema to use
     * @returns The query writer
     */
    with<NS extends ZodTypeAny>(schema: NS): SelectQueryWriter<NS, Q>;
    /**
     * Define the schema that should be used to
     * validate the query result. This is short
     * for `with(z.object(schema))`.
     *
     * @param schema The schema to use
     * @returns The query writer
     */
    withSchema<T extends ZodRawShape>(schema: T): SelectQueryWriter<z.ZodObject<T, "strip", z.ZodTypeAny, z.objectUtil.addQuestionMarks<{ [k_2 in keyof T]: T[k_2]["_output"]; }> extends infer T_1 ? { [k_1 in keyof T_1]: z.objectUtil.addQuestionMarks<{ [k in keyof T]: T[k]["_output"]; }>[k_1]; } : never, z.objectUtil.addQuestionMarks<{ [k_2_1 in keyof T]: T[k_2_1]["_input"]; }> extends infer T_2 ? { [k_3 in keyof T_2]: z.objectUtil.addQuestionMarks<{ [k_2 in keyof T]: T[k_2]["_input"]; }>[k_3]; } : never>, Q>;
    /**
     * Define a schema which accepts any value,
     * useful in situations where a specific schema
     * isn't needed. This is short for `with(z.any())`.
     *
     * @returns The query writer
     */
    withAny(): SelectQueryWriter<z.ZodAny, Q>;
    /**
     * Append another projection to the query. Usually it is recommended
     * to pass projects to `select`, however in certain situations it
     * may be useful to add additional projections to the query.
     *
     * @param projection The projection to add
     * @returns The query writer
     */
    and(projection: string): SelectQueryWriter<S, Q>;
    /**
     * Append a subquery projection to the query. The query will be
     * aliased with the given alias.
     *
     * @param alias The alias for the subquery
     * @param query The subquery
     * @returns The query writer
     */
    andQuery(alias: string, query: SelectQueryWriter<any, any>): SelectQueryWriter<S, Q>;
    /**
     * Specify the targets for the query. This can include table names,
     * record ids, and subqueries.
     *
     * @param targets The targets for the query
     * @returns The query writer
     */
    from(...targets: SurrealValue[]): SelectQueryWriter<S, Q>;
    /**
     * Specify the target for the query as a record pointer.
     *
     * This function automatically sets the limit to 1
     *
     * @param record The record id
     * @returns The query writer
     */
    fromRecord(record: string): SelectQueryWriter<S, 'maybe'>;
    /**
     * Specify the target for the query as a record pointer. This function
     * is especially useful in situations where the table name within a
     * record pointer may be spoofed, and a specific table name is required.
     *
     * This function automatically sets the limit to 1
     *
     * @param table The table name
     * @param id The record id, either the full id or just the unique id
     * @returns The query writer
     */
    fromRecord(table: string, id: string): SelectQueryWriter<S, 'maybe'>;
    /**
     * Specify the target for the query as a relation. This function
     * is especially useful in situations where the table names within a
     * record pointer may be spoofed, and specific table names are required.
     *
     * Since this function will automatically configure a where clause, calling
     * `.where()` manually will throw an exception.
     *
     * @param relation The relation information
     * @param id The record id, either the full id or just the unique id
     * @returns
     */
    fromRelation(relation: RecordRelation): SelectQueryWriter<S, "maybe">;
    /**
     * Define the where clause for the query. All values will be escaped
     * automatically. Use of `raw` is supported, as well as any operators
     * wrapping the raw function.
     *
     * @param where The where clause
     * @returns The query writer
     */
    where(where: string | Where<S>): SelectQueryWriter<S, Q>;
    /**
     * Define the split fields for the query.
     *
     * @param fields The split fields
     * @returns The query writer
     */
    split(...split: SchemaFields<S>[]): SelectQueryWriter<S, Q>;
    /**
     * Define the fields to group by. If you are grouping by all fields, use
     * the groupAll() method instead.
     *
     * @param fields The fields to group by
     * @returns The query writer
     */
    groupBy(...group: SchemaFields<S>[]): SelectQueryWriter<S, Q>;
    /**
     * Group by all fields
     *
     * @returns The query writer
     */
    groupAll(): SelectQueryWriter<S, Q>;
    /**
     * Define the order of the query results. If no order is specified, the
     * default order is ascending.
     *
     * @param order The fields to order by
     * @returns The query writer
     */
    orderBy(field: SchemaFields<S>, order?: Order): SelectQueryWriter<S, Q>;
    orderBy(order: Ordering): SelectQueryWriter<S, Q>;
    /**
     * Limit the number of records returned by the query
     *
     * @param limit The limit
     * @returns The query writer
     */
    limit(limit: number): SelectQueryWriter<S, "many">;
    /**
     * Limit the number of records returned by the query to one.
     * This is useful for queries that are expected to return
     * a single record.
     *
     * Unlike `limit(1)`, this method will cause the query to not
     * return an array of records when executed, but instead a
     * single record.
     */
    one(): SelectQueryWriter<S, "maybe">;
    /**
     * Start the query at the given index
     *
     * @param start The start index
     * @returns The query writer
     */
    start(start: number): SelectQueryWriter<S, Q>;
    /**
     * Define the paths to the fields to fetch
     *
     * @param fields The fields to fetch
     * @returns The query writer
     */
    fetch(...fetch: SchemaFields<S>[]): SelectQueryWriter<S, Q>;
    /**
     * Set the timeout for the query
     *
     * @param seconds The timeout in seconds
     * @returns The query writer
     */
    timeout(timeout: number): SelectQueryWriter<S, Q>;
    /**
     * Run the query in parallel
     *
     * @returns The query writer
     */
    parallel(): SelectQueryWriter<S, Q>;
    toQuery(): string;
}
/**
 * Start a new SELECT query with the given projections. Ommitting the
 * projections will select all fields.
 *
 * @param projections The projections to select
 * @returns The query writer
 */
declare function select(...projections: string[]): SelectQueryWriter<null, "many">;

type ContentMode = 'replace' | 'merge';
interface UpdateQueryState<S extends Schema, Q extends Quantity> {
    schema: S;
    quantity: Q;
    targets: string;
    setFields: object;
    content: object;
    contentMode: ContentMode | undefined;
    where: string | undefined;
    returnMode: ReturnMode | 'fields' | undefined;
    returnFields: string[];
    timeout: number | undefined;
    parallel: boolean;
    relation: boolean;
}
/**
 * The query writer implementations for UPDATE queries.
 *
 * When prevention of SQL injections is important, avoid passing
 * variables to all functions except `where`, `set`, `setAll`,
 * `content`, and `merge`.
 *
 * When using Cirql server side, never trust record ids directly
 * passed to the query writer. Always use the `updateRecord` function
 * to ensure the record id has an intended table name.
 */
declare class UpdateQueryWriter<S extends Schema, Q extends Quantity> implements QueryWriter<S, Q> {
    #private;
    constructor(state: UpdateQueryState<S, Q>);
    get _schema(): S;
    get _quantity(): Q;
    get _state(): Readonly<{
        schema: S;
        quantity: Q;
        targets: string;
        setFields: object;
        content: object;
        contentMode: ContentMode | undefined;
        where: string | undefined;
        returnMode: ReturnMode | "fields" | undefined;
        returnFields: string[];
        timeout: number | undefined;
        parallel: boolean;
        relation: boolean;
    }>;
    /**
     * Define the schema that should be used to
     * validate the query result.
     *
     * @param schema The schema to use
     * @returns The query writer
     */
    with<NS extends ZodTypeAny>(schema: NS): UpdateQueryWriter<NS, Q>;
    /**
     * Define the schema that should be used to
     * validate the query result. This is short
     * for `with(z.object(schema))`.
     *
     * @param schema The schema to use
     * @returns The query writer
     */
    withSchema<T extends ZodRawShape>(schema: T): UpdateQueryWriter<z.ZodObject<T, "strip", z.ZodTypeAny, z.objectUtil.addQuestionMarks<{ [k_2 in keyof T]: T[k_2]["_output"]; }> extends infer T_1 ? { [k_1 in keyof T_1]: z.objectUtil.addQuestionMarks<{ [k in keyof T]: T[k]["_output"]; }>[k_1]; } : never, z.objectUtil.addQuestionMarks<{ [k_2_1 in keyof T]: T[k_2_1]["_input"]; }> extends infer T_2 ? { [k_3 in keyof T_2]: z.objectUtil.addQuestionMarks<{ [k_2 in keyof T]: T[k_2]["_input"]; }>[k_3]; } : never>, Q>;
    /**
     * Define a schema which accepts any value,
     * useful in situations where a specific schema
     * isn't needed. This is short for `with(z.any())`.
     *
     * @returns The query writer
     */
    withAny(): UpdateQueryWriter<z.ZodAny, Q>;
    /**
     * Set an individual field to a value
     *
     * @param key The field name
     * @param value The value
     * @returns
     */
    set(key: SchemaFields<S>, value: any): UpdateQueryWriter<S, Q>;
    /**
     * Set multiple fields at once using an object. Supports
     * recursive objects and raw values. Can be used as effective
     * alternative to `content`.
     *
     * @param fields The object to use for setting fields
     * @returns The query writer
     */
    setAll(fields: SchemaInput<S>): UpdateQueryWriter<S, Q>;
    /**
     * Set the new content for the record. The content is
     * serialized to JSON, meaning you can not use raw query values.
     *
     * When raw values are needed, use the `setAll` function instead.
     *
     * @param content The content for the record
     * @returns The query writer
     */
    content(content: SchemaInput<S>): UpdateQueryWriter<S, Q>;
    /**
     * Merge the content into the record. The content is
     * serialized to JSON, meaning you can not use raw query values.
     *
     * When raw values are needed, use the `setAll` function instead.
     *
     * @param content The content for the record
     * @returns The query writer
     */
    merge(content: SchemaInput<S>): UpdateQueryWriter<S, Q>;
    /**
     * Define the where clause for the query. All values will be escaped
     * automatically. Use of `raw` is supported, as well as any operators
     * wrapping the raw function.
     *
     * @param where The where clause
     * @returns The query writer
     */
    where(where: string | Where<S>): UpdateQueryWriter<S, Q>;
    /**
     * Define the return behavior for the query
     *
     * @param value The return behavior
     * @returns The query writer
     */
    return(mode: ReturnMode): UpdateQueryWriter<S, Q>;
    /**
     * Define the return behavior for the query
     *
     * @param value The return behavior
     * @returns The query writer
     */
    returnFields(...fields: SchemaFields<S>[]): UpdateQueryWriter<S, Q>;
    /**
     * Set the timeout for the query
     *
     * @param seconds The timeout in seconds
     * @returns The query writer
     */
    timeout(timeout: number): UpdateQueryWriter<S, Q>;
    /**
     * Run the query in parallel
     *
     * @returns The query writer
     */
    parallel(): UpdateQueryWriter<S, Q>;
    toQuery(): string;
}
/**
 * Start a new UPDATE query with the given targets.
 *
 * @param targets The targets to update
 * @returns The query writer
 */
declare function update(...targets: SurrealValue[]): UpdateQueryWriter<null, "many">;
/**
 * Start a new UPDATE query for the given record. This function
 * is especially useful in situations where the table name within a
 * record pointer may be spoofed, and a specific table name is required.
 *
 * @param record The record id
 * @returns The query writer
 */
declare function updateRecord(record: string): UpdateQueryWriter<null, 'maybe'>;
/**
 * Start a new UPDATE query for the given record. This function
 * is especially useful in situations where the table name within a
 * record pointer may be spoofed, and a specific table name is required.
 *
 * @param table The record table
 * @param id The record id, either the full id or just the unique id
 * @returns The query writer
 */
declare function updateRecord(table: string, id: string): UpdateQueryWriter<null, 'maybe'>;
/**
 * Start a new UPDATE query for the given relation. This function
 * is especially useful in situations where the table names within a
 * record pointer may be spoofed, and specific table names are required.
 *
 * Since this function will automatically configure a where clause, calling
 * `.where()` manually will throw an exception.
 *
 * @param relation The relation information
 * @returns The query writer
 */
declare function updateRelation(relation: RecordRelation): UpdateQueryWriter<null, "maybe">;

/**
 * A special query writer implementation for executing raw queries.
 *
 * When prevention of SQL injections is important, avoid passing
 * any variables directly to this query. Instead, use params.
 */
declare class PlainQueryWriter<S extends Schema, Q extends Quantity> implements QueryWriter<S, Q> {
    #private;
    constructor(schema: S, query: string, quantity: Q);
    get _quantity(): Q;
    get _schema(): S;
    /**
     * Define the schema that should be used to
     * validate the query result.
     *
     * @param schema The schema to use
     * @returns The query writer
     */
    with<NS extends ZodTypeAny>(schema: NS): PlainQueryWriter<NS, Q>;
    /**
     * Define the schema that should be used to
     * validate the query result. This is short
     * for `with(z.object(schema))`.
     *
     * @param schema The schema to use
     * @returns The query writer
     */
    withSchema<T extends ZodRawShape>(schema: T): PlainQueryWriter<z.ZodObject<T, "strip", z.ZodTypeAny, z.objectUtil.addQuestionMarks<{ [k_2 in keyof T]: T[k_2]["_output"]; }> extends infer T_1 ? { [k_1 in keyof T_1]: z.objectUtil.addQuestionMarks<{ [k in keyof T]: T[k]["_output"]; }>[k_1]; } : never, z.objectUtil.addQuestionMarks<{ [k_2_1 in keyof T]: T[k_2_1]["_input"]; }> extends infer T_2 ? { [k_3 in keyof T_2]: z.objectUtil.addQuestionMarks<{ [k_2 in keyof T]: T[k_2]["_input"]; }>[k_3]; } : never>, Q>;
    /**
     * Define a schema which accepts any value,
     * useful in situations where a specific schema
     * isn't needed. This is short for `with(z.any())`.
     *
     * @returns The query writer
     */
    withAny(): PlainQueryWriter<z.ZodAny, Q>;
    /**
     * Expect at most one record to be returned
     *
     * @returns The query writer
     */
    single(): PlainQueryWriter<S, "maybe">;
    toQuery(): string;
}
/**
 * Create a query writer for the given raw query string
 *
 * @param rawQuery The
 * @returns The query writer
 */
declare function query(rawQuery: string): PlainQueryWriter<null, "many">;

/**
 * Create a LET query assigning the supplied value to the
 * given parameter name. The value can be any value, including
 * a raw value or another query writer.
 *
 * @param name The parameter name
 * @param value The value, raw value, or query writer
 * @returns The query writer
 */
declare function letValue(name: string, value: SurrealValue): QueryWriter<ZodUndefined, 'zero'>;

type RawQuery = {
    [Raw]: string;
};
interface RootAuth {
    user: string;
    pass: string;
}
interface NamespaceAuth {
    NS: string;
    user: string;
    pass: string;
}
interface DatabaseAuth {
    NS: string;
    DB: string;
    user: string;
    pass: string;
}
interface ScopeAuth {
    NS: string;
    DB: string;
    SC: string;
    [key: string]: unknown;
}
interface TokenAuth {
    token: string;
}
type AuthenticationDetails = TokenAuth | (RootAuth | NamespaceAuth | DatabaseAuth | ScopeAuth);
type RegistrationDetails = RootAuth | NamespaceAuth | DatabaseAuth | ScopeAuth;
interface ConnectionDetails {
    /**
     * The endpoint to connect to e.g. http://localhost:8000
    */
    endpoint: string;
    /**
     * The namespace to connect to for executing queries
     */
    namespace?: string;
    /**
     * The database to connect to for executing queries
     */
    database?: string;
}
/**
 * A value which can be used within a query. Either a
 * raw query string, a query writer, or any other value.
 */
type SurrealValue = RawQuery | QueryWriter<any, any> | any;

type QueryRequestBase = {
    params?: Params;
    validate?: boolean;
};
type InferredQueryRequest<Q extends Quantity, S extends ZodTypeAny> = {
    query: QueryWriter<S, Q>;
    schema?: never;
};
type SchemaQueryRequest<Q extends Quantity, S extends ZodTypeAny> = {
    query: QueryWriter<null, Q>;
    schema: S;
};
type QuantitativeTypeOf<Q extends Quantity, S extends ZodTypeAny> = Q extends 'one' ? TypeOf<S> : Q extends 'maybe' ? TypeOf<S> | null : Q extends 'many' ? TypeOf<S>[] : undefined;
type SoloTypeOf<T extends QueryRequest<any, any>> = T extends InferredQueryRequest<any, any> ? QuantitativeTypeOf<T['query']['_quantity'], T['query']['_schema']> : QuantitativeTypeOf<T['query']['_quantity'], T['schema']>;
type MultiTypeOf<T extends QueryRequest<any, any>[]> = {
    [K in keyof T]: T[K] extends InferredQueryRequest<any, any> ? QuantitativeTypeOf<T[K]['query']['_quantity'], T[K]['query']['_schema']> : QuantitativeTypeOf<T[K]['query']['_quantity'], T[K]['schema']>;
};
type Params = Record<string, any>;
type QueryRequest<Q extends Quantity, S extends ZodTypeAny> = QueryRequestBase & (SchemaQueryRequest<Q, S> | InferredQueryRequest<Q, S>);
interface CirqlBaseOptions {
    connection: ConnectionDetails;
    credentials?: AuthenticationDetails;
    logging?: boolean;
    logPrinter?: (query: string, params: any) => void;
}
interface CirqlOptions extends CirqlBaseOptions {
    autoConnect?: boolean;
    retryCount?: number;
    retryDelay?: number;
}
interface CirqlStatelessOptions extends CirqlBaseOptions {
}

interface SurrealHandle {
    close(): void;
    query(query: string, params?: Record<string, any>): Promise<any>;
    signIn(credentials: AuthenticationDetails): Promise<string>;
    signUp(registration: RegistrationDetails): Promise<string>;
    signOut(): Promise<void>;
}

/**
 * The adapter used to connect to Cirql implementations
 */
interface CirqlAdapter {
    onQuery: (query: string, params: Record<string, any>) => Promise<any>;
    onRequest: () => boolean;
    onLog: (query: string, params: Params) => void;
}
/**
 * The abstract base implemention for Cirql. This class is agnostic to
 * the concept of connections.
 */
declare abstract class CirqlBaseImpl extends EventTarget {
    #private;
    constructor(config: CirqlAdapter);
    /**
     * Execute a single query and return the result
     *
     * @param request The query to execute
     * @returns The result of the query
     */
    execute<T extends QueryRequest<any, ZodTypeAny>>(request: T): Promise<SoloTypeOf<T>>;
    /**
     * Execute multiple queries and return the results in the same order
     *
     * @param request The queries to execute
     * @returns The results of the queries, can be destructured
     */
    batch<T extends QueryRequest<any, ZodTypeAny>[]>(...request: T): Promise<MultiTypeOf<T>>;
    /**
     * Execute multiple queries and return the results in the same order. Unlike
     * `batch`, this method will execute the queries in a transaction.
     *
     * @param request The queries to execute
     * @returns The results of the queries, can be destructured
     */
    transaction<T extends QueryRequest<any, ZodTypeAny>[]>(...request: T): Promise<MultiTypeOf<T>>;
    /**
     * Sign in with the provided credentials or session token
     *
     * @param credentials The credentials to sign in with
     * @returns The session token, can be saved and used to sign in again later
     */
    abstract signIn(credentials: AuthenticationDetails): Promise<string | undefined>;
    /**
     * Sign up with the provided credentials
     *
     * @param registration The credentials to sign up with
     * @returns The session token, can be saved and used to sign in again later
     */
    abstract signUp(registration: RegistrationDetails): Promise<string | undefined>;
    /**
     * Sign out of the current session
     */
    abstract signOut(): Promise<void>;
}

type RequiredOptions = Required<Omit<CirqlOptions, 'credentials'>> & Pick<CirqlOptions, 'credentials'>;
type RequiredStatelessOptions = Required<Omit<CirqlStatelessOptions, 'credentials'>> & Pick<CirqlStatelessOptions, 'credentials'>;
/**
 * A stateful connection to a Surreal database. This class provides full access
 * to all of Cirql's ORM functionality.
 *
 * Events:
 * - connect: The connection is being established
 * - open: The connection was successfully opened
 * - close: The connection was closed
 * - error: An error occured in the connection
 */
declare class Cirql extends CirqlBaseImpl {
    #private;
    readonly options: RequiredOptions;
    constructor(options: CirqlOptions);
    /**
     * Returns whether the database is connected or not
     */
    get isConnected(): boolean;
    /**
     * Returns the underlying Surreal handle
     */
    get handle(): SurrealHandle | null;
    /**
     * Manually open a connection to the Surreal database
     */
    connect(): void;
    /**
     * Terminate the active connection
     */
    disconnect(): void;
    /**
     * Returns a promise which resolves when the connection is ready
     *
     * @returns A promise
     */
    ready(): Promise<void>;
    signIn(credentials: AuthenticationDetails): Promise<string | undefined>;
    signUp(registration: RegistrationDetails): Promise<string | undefined>;
    signOut(): Promise<void>;
}
/**
 * A stateless class used to send one-off queries to a Surreal database.
 * This class provides full access to all of Cirql's ORM functionality.
 */
declare class CirqlStateless extends CirqlBaseImpl {
    #private;
    readonly options: RequiredStatelessOptions;
    constructor(options: CirqlStatelessOptions);
    signIn(_credentials: AuthenticationDetails): Promise<string>;
    signUp(_registration: RegistrationDetails): Promise<string>;
    signOut(): Promise<void>;
}

type ErrorCodes = 'no_connection' | 'invalid_query' | 'invalid_request' | 'invalid_response' | 'query_failure' | 'parse_failure' | 'too_many_results' | 'auth_failure';
/**
 * An error thrown during the building or execution of a Cirql query
 */
declare class CirqlError extends Error {
    readonly code: ErrorCodes;
    constructor(message: string, code: ErrorCodes);
}
/**
 * An error thrown during the parsing of a Cirql query response
 */
declare class CirqlParseError extends CirqlError {
    readonly reason: ZodError;
    constructor(message: string, reason: ZodError);
}
/**
 * An error thrown when a query writer is unable to generate a query
 */
declare class CirqlWriterError extends CirqlError {
    readonly query?: QueryWriter<any, any>;
    constructor(message: string, query?: QueryWriter<any, any>);
}
/**
 * An error thrown when one or more queries fail to execute successfully
 */
declare class CirqlQueryError extends CirqlError {
    readonly errors: string[];
    constructor(errors: string[]);
}
/**
 * An error thrown when authentication fails
 */
declare class CirqlAuthenticationError extends CirqlError {
    constructor(message: string);
}

/**
 * A zod schema which matches any SurrealDB record. This schema
 * defines the `id` field as a string. You can extend this schema
 * to add additional fields to your records.
 */
declare const RecordSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
/**
 * A zod schema which matches any SurrealDB edge record. This schema
 * defines the `id`, `in`, and `out` fields as strings. You can extend
 * this schema to add additional fields to your edges.
 */
declare const EdgeSchema: z.ZodObject<{
    id: z.ZodString;
    in: z.ZodString;
    out: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    in: string;
    out: string;
}, {
    id: string;
    in: string;
    out: string;
}>;
/**
 * Parse a string of queries into a list of query requests.
 * Each query is expected to be seperated by a semicolon. The
 * queries will be validated against `z.any()` and will not be
 * type checked.
 *
 * You can pass the result of this function to `batch` or `transaction`.
 *
 * Example:
 * ```ts
 * const [user, posts] = await db.batch(...parseQueries('SELECT * FROM users; SELECT * FROM posts'));
 * ```
 *
 * @param queries A string of queries seperated by semicolons
 * @returns A list of query requests
 */
declare function parseQueries(queries: string): QueryRequest<'many', ZodTypeAny>[];

/**
 * Used to insert raw values into a query
 *
 * @param value The raw query content
 */
declare function raw(value: string): RawQuery;
/**
 * Used to insert a raw parameter into a query
 *
 * @param name The parameter name
 */
declare function param(name: string): RawQuery;

/**
 * Returns a raw query operator for `=`
 *
 * @param value The value to check
 * @returns The raw query
 */
declare function eq(value: SurrealValue): RawQuery;
/**
 * Returns a raw query operator for `!=`
 *
 * @param value The value to check
 * @returns The raw query
 */
declare function neq(value: SurrealValue): RawQuery;
/**
 * Returns a raw query operator for `==`
 *
 * @param value The value to check
 * @returns The raw query
 */
declare function eeq(value: SurrealValue): RawQuery;
/**
 * Returns a raw query operator for `?=`
 *
 * @param value The value to check
 * @returns The raw query
 */
declare function any(value: SurrealValue): RawQuery;
/**
 * Returns a raw query operator for `*=`
 *
 * @param value The value to check
 * @returns The raw query
 */
declare function all(value: SurrealValue): RawQuery;
/**
 * Returns a raw query operator for `~`
 *
 * @param value The value to check
 * @returns The raw query
 */
declare function feq(value: SurrealValue): RawQuery;
/**
 * Returns a raw query operator for `!~`
 *
 * @param value The value to check
 * @returns The raw query
 */
declare function nfeq(value: SurrealValue): RawQuery;
/**
 * Returns a raw query operator for `?~`
 *
 * @param value The value to check
 * @returns The raw query
 */
declare function fany(value: SurrealValue): RawQuery;
/**
 * Returns a raw query operator for `*~`
 *
 * @param value The value to check
 * @returns The raw query
 */
declare function fall(value: SurrealValue): RawQuery;
/**
 * Returns a raw query operator for `<`
 *
 * @param value The value to check
 * @returns The raw query
 */
declare function lt(value: SurrealValue): RawQuery;
/**
 * Returns a raw query operator for `<=`
 *
 * @param value The value to check
 * @returns The raw query
 */
declare function lte(value: SurrealValue): RawQuery;
/**
 * Returns a raw query operator for `>`
 *
 * @param value The value to check
 * @returns The raw query
 */
declare function gt(value: SurrealValue): RawQuery;
/**
 * Returns a raw query operator for `>=`
 *
 * @param value The value to check
 * @returns The raw query
 */
declare function gte(value: SurrealValue): RawQuery;
/**
 * Returns a raw query operator for `CONTAINS`
 *
 * @param value The value to check
 * @returns The raw query
 */
declare function contains(value: SurrealValue): RawQuery;
/**
 * Returns a raw query operator for `CONTAINSNOT`
 *
 * @param value The value to check
 * @returns The raw query
 */
declare function containsNot(value: SurrealValue): RawQuery;
/**
 * Returns a raw query operator for `CONTAINSALL`
 *
 * @param value The value to check
 * @returns The raw query
 */
declare function containsAll(value: SurrealValue): RawQuery;
/**
 * Returns a raw query operator for `CONTAINSANY`
 *
 * @param value The value to check
 * @returns The raw query
 */
declare function containsAny(value: SurrealValue): RawQuery;
/**
 * Returns a raw query operator for `CONTAINSNONE`
 *
 * @param value The value to check
 * @returns The raw query
 */
declare function containsNone(value: SurrealValue): RawQuery;
/**
 * Returns a raw query operator for `INSIDE`
 *
 * @param value The value to check
 * @returns The raw query
 */
declare function inside(value: SurrealValue): RawQuery;
/**
 * Returns a raw query operator for `NOTINSIDE`
 *
 * @param value The value to check
 * @returns The raw query
 */
declare function notInside(value: SurrealValue): RawQuery;
/**
 * Returns a raw query operator for `ALLINSIDE`
 *
 * @param value The value to check
 * @returns The raw query
 */
declare function allInside(value: SurrealValue): RawQuery;
/**
 * Returns a raw query operator for `ANYINSIDE`
 *
 * @param value The value to check
 * @returns The raw query
 */
declare function anyInside(value: SurrealValue): RawQuery;
/**
 * Returns a raw query operator for `NONEINSIDE`
 *
 * @param value The value to check
 * @returns The raw query
 */
declare function noneInside(value: SurrealValue): RawQuery;
/**
 * Returns a raw query operator for `OUTSIDE`
 *
 * @param value The value to check
 * @returns The raw query
 */
declare function outside(value: SurrealValue): RawQuery;
/**
 * Returns a raw query operator for `INTERSECTS`
 *
 * @param value The value to check
 * @returns The raw query
 */
declare function intersects(value: SurrealValue): RawQuery;
/**
 * Returns a raw query operator for `+=`
 *
 * @param value The value to add
 * @returns The raw query
 */
declare function add(value: SurrealValue): RawQuery;
/**
 * Returns a raw query operator for `-=`
 *
 * @param value The value to remove
 * @returns The raw query
 */
declare function remove(value: SurrealValue): RawQuery;

/**
 * Inserts a raw function call for `type::bool()`
 *
 * @param value The value to cast
 * @returns The raw query
 */
declare function bool$1(value: SurrealValue): RawQuery;
/**
 * Inserts a raw function call for `type::datetime()`
 *
 * @param value The value to cast
 * @returns The raw query
 */
declare function datetime(value: SurrealValue): RawQuery;
/**
 * Inserts a raw function call for `type::decimal()`
 *
 * @param value The value to cast
 * @returns The raw query
 */
declare function decimal(value: SurrealValue): RawQuery;
/**
 * Inserts a raw function call for `type::duration()`
 *
 * @param value The value to cast
 * @returns The raw query
 */
declare function duration(value: SurrealValue): RawQuery;
/**
 * Inserts a raw function call for `type::float()`
 *
 * @param value The value to cast
 * @returns The raw query
 */
declare function float$1(value: SurrealValue): RawQuery;
/**
 * Inserts a raw function call for `type::int()`
 *
 * @param value The value to cast
 * @returns The raw query
 */
declare function int$1(value: SurrealValue): RawQuery;
/**
 * Inserts a raw function call for `type::number()`
 *
 * @param value The value to cast
 * @returns The raw query
 */
declare function number(value: SurrealValue): RawQuery;
/**
 * Inserts a raw function call for `type::point()`
 *
 * @param value The value to cast
 * @returns The raw query
 */
declare function point(value: SurrealValue): RawQuery;
/**
 * Inserts a raw function call for `type::point()`
 *
 * @param longitude The longitude value
 * @param latitude The latitude value
 * @returns The raw query
 */
declare function point(longitude: SurrealValue, latitude: SurrealValue): RawQuery;
/**
 * Inserts a raw function call for `type::regex()`
 *
 * @param value The value to cast
 * @returns The raw query
 */
declare function regex(value: SurrealValue): RawQuery;
/**
 * Inserts a raw function call for `type::string()`
 *
 * @param value The value to cast
 * @returns The raw query
 */
declare function string$1(value: SurrealValue): RawQuery;
/**
 * Inserts a raw function call for `type::table()`
 *
 * @param table The table name
 * @returns The raw query
 */
declare function table(tb: SurrealValue): RawQuery;
/**
 * Inserts a raw function call for `type::thing()`
 *
 * @param table The table name
 * @param id The record id
 * @returns The raw query
 */
declare function thing(tb: SurrealValue, id: SurrealValue): RawQuery;
/**
 * Raw query functions for the category `type`
 */
declare const type: {
    bool: typeof bool$1;
    datetime: typeof datetime;
    decimal: typeof decimal;
    duration: typeof duration;
    float: typeof float$1;
    int: typeof int$1;
    number: typeof number;
    point: typeof point;
    regex: typeof regex;
    string: typeof string$1;
    table: typeof table;
    thing: typeof thing;
};

/**
 * Inserts a raw function call for `time::now()`
 *
 * @returns The raw query
 */
declare function now(): RawQuery;
/**
 * Raw query functions for the category `time`
 */
declare const time$1: {
    now: typeof now;
};

/**
 * Inserts a raw function call for `rand::bool()`
 *
 * @returns The raw query
 */
declare function bool(): RawQuery;
/**
 * Inserts a raw function call for `rand::enum()`
 *
 * @returns The raw query
 */
declare function enumOf(value: SurrealValue[]): RawQuery;
/**
 * Inserts a raw function call for `rand::float()`
 *
 * @returns The raw query
 */
declare function float(min?: number, max?: number): RawQuery;
/**
 * Inserts a raw function call for `rand::guid()`
 *
 * @returns The raw query
 */
declare function guid(length?: number): RawQuery;
/**
 * Inserts a raw function call for `rand::int()`
 *
 * @returns The raw query
 */
declare function int(min?: number, max?: number): RawQuery;
/**
 * Inserts a raw function call for `rand::string()`
 *
 * @returns The raw query
 */
declare function string(length?: number): RawQuery;
/**
 * Inserts a raw function call for `rand::time()`
 *
 * @returns The raw query
 */
declare function time(minUnix?: number, maxUnix?: number): RawQuery;
/**
 * Inserts a raw function call for `rand::uuid()`
 *
 * @returns The raw query
 */
declare function uuid(): RawQuery;
/**
 * Raw query functions for the category `rand`
 */
declare const rand: {
    bool: typeof bool;
    enumOf: typeof enumOf;
    float: typeof float;
    guid: typeof guid;
    int: typeof int;
    string: typeof string;
    time: typeof time;
    uuid: typeof uuid;
};

export { AuthenticationDetails, Cirql, CirqlAuthenticationError, CirqlBaseOptions, CirqlError, CirqlOptions, CirqlParseError, CirqlQueryError, CirqlStateless, CirqlStatelessOptions, CirqlWriterError, ConnectionDetails, CountQueryWriter, CreateQueryWriter, DatabaseAuth, DeleteQueryWriter, EdgeSchema, ErrorCodes, FieldOrRaw, InferredQueryRequest, MultiTypeOf, NamespaceAuth, OpenUnion, Order, Ordering, Params, QuantitativeTypeOf, Quantity, QueryRequest, QueryRequestBase, QueryWriter, RawQuery, RecordRelation, RecordSchema, RegistrationDetails, RelateQueryWriter, ReturnMode, RootAuth, Schema, SchemaFields, SchemaInput, SchemaQueryRequest, ScopeAuth, SelectQueryWriter, SoloTypeOf, SurrealValue, TokenAuth, UpdateQueryWriter, Where, add, all, allInside, any, anyInside, contains, containsAll, containsAny, containsNone, containsNot, count, countRecord, countRelation, create, createRecord, del, delRecord, delRelation, eeq, eq, fall, fany, feq, gt, gte, inside, intersects, letValue, lt, lte, neq, nfeq, noneInside, notInside, outside, param, parseQueries, query, rand, raw, relate, relateRelation, remove, select, time$1 as time, type, update, updateRecord, updateRelation };
