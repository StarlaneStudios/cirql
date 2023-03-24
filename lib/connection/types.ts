import { ConnectionDetails, AuthenticationDetails, RegistrationDetails } from "../types";

export type Operation = [(data: any) => void, (error: any) => void];

export interface SurrealOptions {
	connection: ConnectionDetails;
	credentials?: AuthenticationDetails;
	queryTimeout: number;
	onConnect?: () => void;
	onDisconnect?: (code: number, reason: string) => void;
	onError?: (error: any) => void;
}

export interface SurrealHandle {
	close(): void;
	query(query: string, params?: Record<string, any>): Promise<any>;
	signIn(credentials: AuthenticationDetails): Promise<string>;
	signUp(registration: RegistrationDetails): Promise<string>;
	signOut(): Promise<void>;
}