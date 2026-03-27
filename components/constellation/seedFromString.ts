/** djb2 hash: converts a string to a 32-bit unsigned integer suitable as a PRNG seed. */
export function seedFromString(str: string): number {
	let hash = 5381
	for (let i = 0; i < str.length; i++) {
		hash = ((hash << 5) + hash) ^ str.charCodeAt(i)
		hash = hash >>> 0 // keep as unsigned 32-bit
	}
	return hash
}
