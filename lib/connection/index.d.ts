import { SurrealOptions, SurrealHandle } from './types';
/**
 * Create a new Surreal connection
 *
 * @param options The connection options
 * @returns A handle to the connection
 */
export declare function openConnection(options: SurrealOptions): SurrealHandle;
