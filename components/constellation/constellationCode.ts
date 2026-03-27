/**
 * Derives a short, stable identifier for a user's constellation.
 * Changes when roles are added or removed — the constellation evolves with the user.
 */
export async function constellationCode(
	email: string,
	roleIds: string[],
): Promise<string> {
	const input = email + roleIds.slice().sort().join(',')
	const encoded = new TextEncoder().encode(input)
	const hashBuffer = await crypto.subtle.digest('SHA-256', encoded)
	const hex = Array.from(new Uint8Array(hashBuffer))
		.map(b => b.toString(16).padStart(2, '0'))
		.join('')
	return `NGC-${hex.slice(0, 4).toUpperCase()}-${hex.slice(4, 8).toUpperCase()}`
}
