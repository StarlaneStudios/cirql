const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/** Generate a random id */
export function nextId(post?: string) {
	let result = '';

	for (let i = 0; i < 7; i++) {
		result += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
	}

	return post ? `${result}_${post}` : result;
}

/** Generate a thing query type */
export function thing(tb: string, id: string) {
	return `type::thing($${tb}, $${id})`;
}

/** Generate a table query type */
export function table(tb: string) {
	return `type::table($${tb})`;
}