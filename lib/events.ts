/**
 * An event thrown when a Cirql connection was closed
 */
export class CirqlCloseEvent extends Event {
	
	readonly code: number;
	readonly reason: string;

	constructor(code: number, reason: string) {
		super('close');
		this.code = code;
		this.reason = reason;
	}

}

/**
 * An event thrown when a Cirql connection encounters an error
 */
export class CirqlErrorEvent extends Event {
	
	readonly error: any;

	constructor(error: any) {
		super('error');
		this.error = error;
	}

}