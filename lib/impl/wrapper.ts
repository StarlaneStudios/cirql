import { CirqlOptions } from "../types";
import { CirqlBaseImpl } from "./base";
import { Surreal } from "surrealdb.js";

type RequiredOptions = Required<CirqlOptions>;

/**
 * A wrapper class which provides all Cirql functionality on top of surrealdb.js
 */
export class Cirql extends CirqlBaseImpl {
	
	readonly options: RequiredOptions;

	#surreal: Surreal;

	constructor(surreal: Surreal, options?: CirqlOptions) {
		super({
			onQuery: (query, params) => this.handle!.query(query, params),
			onRequest: () => !!this.handle && this.handle.status == 0,
			onLog: (query, params) => {
				if (options?.logging) {
					options.logPrinter?.(query, params);
				}
			}
		});

		this.#surreal = surreal;

		this.options = {
			logging: false,
			logPrinter: (query) => console.log(query),
			...options
		};
	}

	/**
	 * Returns the underlying surrealdb.js handle
	 */
	get handle() {
		return this.#surreal;
	}

}