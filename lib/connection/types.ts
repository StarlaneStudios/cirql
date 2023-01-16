import { ConnectionDetails, CredentialDetails } from "../types";

export type Operation = [(data: any) => void, (error: any) => void];

export interface SurrealOptions {
	connection: ConnectionDetails;
	credentials: CredentialDetails;
	onConnect?: () => void;
	onDisconnect?: (code: number, reason: string) => void;
	onError?: (error: any) => void;
}

export interface SurrealHandle {
	close(): void;
	query(query: string, params?: Record<string, any>): Promise<any>;
}