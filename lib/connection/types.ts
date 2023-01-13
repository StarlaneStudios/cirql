import { ConnectionDetails, CredentialDetails } from "../types";

export type Operation = [(data: any) => void, (error: any) => void];

export interface SurrealOptions {
	connection: ConnectionDetails;
	credentials: CredentialDetails;
	onConnect?: () => void;
	onDisconnect?: () => void;
	onError?: (code: number, reason: string) => void;
}

export interface SurrealHandle {
	close(): void;
	query(query: string, params?: Record<string, any>): Promise<any>;
}