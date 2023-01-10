const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/** Generate a random id */
export function nextId() {
	let result = '';

	for (let i = 0; i < 7; i++) {
		result += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
	}

	return result;
}