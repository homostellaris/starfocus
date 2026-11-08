const BAYER_MATRIX_4X4 = [
	[0, 8, 2, 10],
	[12, 4, 14, 6],
	[3, 11, 1, 9],
	[15, 7, 13, 5],
] as const

export function hashStringToSeed(input: string): number {
	const safeInput = typeof input === 'string' && input.length > 0 ? input : '__starfocus_default_seed__'
	let hashValue = 2166136261
	for (let index = 0; index < safeInput.length; index++) {
		hashValue ^= safeInput.charCodeAt(index)
		hashValue = Math.imul(hashValue, 16777619)
	}
	const unsignedSeed = hashValue >>> 0
	return unsignedSeed === 0 ? 1 : unsignedSeed
}

export function createSeededRandom(seed: number): () => number {
	let state = sanitizeSeed(seed)
	return () => {
		state = (state + 0x6d2b79f5) | 0
		let intermediate = Math.imul(state ^ (state >>> 15), 1 | state)
		intermediate =
			(intermediate + Math.imul(intermediate ^ (intermediate >>> 7), 61 | intermediate)) ^
			intermediate
		return ((intermediate ^ (intermediate >>> 14)) >>> 0) / 4294967296
	}
}

export function sampleFractalNoise2D(
	coordinateX: number,
	coordinateY: number,
	seed: number,
	octaveCount = 4,
): number {
	if (!Number.isFinite(octaveCount) || octaveCount <= 0) {
		return 0
	}

	const safeOctaves = Math.min(8, Math.floor(octaveCount))
	let totalValue = 0
	let frequency = 1
	let amplitude = 1
	let maximumAmplitude = 0

	for (let octaveIndex = 0; octaveIndex < safeOctaves; octaveIndex++) {
		totalValue +=
			sampleSimplexNoise2D(
				coordinateX * frequency,
				coordinateY * frequency,
				seed + octaveIndex * 1013,
			) * amplitude
		maximumAmplitude += amplitude
		amplitude *= 0.5
		frequency *= 2
	}

	if (maximumAmplitude === 0) {
		return 0
	}

	return clampNumber(totalValue / maximumAmplitude, -1, 1)
}

export function sampleSimplexNoise2D(
	coordinateX: number,
	coordinateY: number,
	seed: number,
): number {
	const safeX = sanitizeCoordinate(coordinateX)
	const safeY = sanitizeCoordinate(coordinateY)
	const safeSeed = sanitizeSeed(seed)

	const gridX0 = Math.floor(safeX)
	const gridY0 = Math.floor(safeY)
	const gridX1 = gridX0 + 1
	const gridY1 = gridY0 + 1

	const fractionalX = safeX - gridX0
	const fractionalY = safeY - gridY0

	const smoothX = fadeCurve(fractionalX)
	const smoothY = fadeCurve(fractionalY)

	const gradient00 = dotGridGradient(gridX0, gridY0, safeX, safeY, safeSeed)
	const gradient10 = dotGridGradient(gridX1, gridY0, safeX, safeY, safeSeed)
	const gradient01 = dotGridGradient(gridX0, gridY1, safeX, safeY, safeSeed)
	const gradient11 = dotGridGradient(gridX1, gridY1, safeX, safeY, safeSeed)

	const interpolatedTop = linearInterpolate(gradient00, gradient10, smoothX)
	const interpolatedBottom = linearInterpolate(gradient01, gradient11, smoothX)
	const rawNoise = linearInterpolate(interpolatedTop, interpolatedBottom, smoothY)

	return clampNumber(rawNoise * 1.414, -1, 1)
}

export function shouldApplyBayerDither(
	coordinateX: number,
	coordinateY: number,
	intensity: number,
): boolean {
	if (Number.isNaN(intensity)) {
		return false
	}
	if (intensity <= 0) {
		return false
	}
	if (intensity >= 1) {
		return true
	}

	const safeX = Number.isFinite(coordinateX) ? Math.floor(coordinateX) : 0
	const safeY = Number.isFinite(coordinateY) ? Math.floor(coordinateY) : 0
	const wrappedColumn = ((safeX % 4) + 4) % 4
	const wrappedRow = ((safeY % 4) + 4) % 4

	const threshold = (BAYER_MATRIX_4X4[wrappedRow][wrappedColumn] + 0.5) / 16
	return intensity > threshold
}

function dotGridGradient(
	gridX: number,
	gridY: number,
	pointX: number,
	pointY: number,
	seed: number,
): number {
	const angle = hashCoordinatesToAngle(gridX, gridY, seed)
	const gradientVectorX = Math.cos(angle)
	const gradientVectorY = Math.sin(angle)
	const distanceX = pointX - gridX
	const distanceY = pointY - gridY
	return distanceX * gradientVectorX + distanceY * gradientVectorY
}

function hashCoordinatesToAngle(
	gridX: number,
	gridY: number,
	seed: number,
): number {
	let mixed =
		Math.imul(gridX, 374761393) +
		Math.imul(gridY, 668265263) +
		Math.imul(seed, 1442695041)
	mixed = (mixed ^ (mixed >>> 13)) >>> 0
	mixed = Math.imul(mixed, 1274126177) >>> 0
	return ((mixed ^ (mixed >>> 16)) >>> 0) / 4294967296 * Math.PI * 2
}

function fadeCurve(value: number): number {
	return value * value * value * (value * (value * 6 - 15) + 10)
}

function linearInterpolate(start: number, end: number, amount: number): number {
	return start + amount * (end - start)
}

function sanitizeSeed(seed: number): number {
	if (!Number.isFinite(seed)) {
		return 2166136261
	}
	const unsigned = Math.floor(Math.abs(seed)) >>> 0
	return unsigned === 0 ? 1 : unsigned
}

function sanitizeCoordinate(coordinate: number): number {
	if (!Number.isFinite(coordinate)) {
		return 0
	}
	return clampNumber(coordinate, -100000, 100000)
}

function clampNumber(value: number, minimum: number, maximum: number): number {
	return Math.max(minimum, Math.min(maximum, value))
}
