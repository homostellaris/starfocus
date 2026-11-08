import { expect, test } from 'bun:test'
import {
	createSeededRandom,
	hashStringToSeed,
	sampleFractalNoise2D,
	sampleSimplexNoise2D,
	shouldApplyBayerDither,
} from './proceduralMath'

test('hashStringToSeed returns identical unsigned 32-bit integers for identical todo identifiers', () => {
	const firstHash = hashStringToSeed('tds0Q5i__n4r2jYrf8JQB_p2z|ucom')
	const secondHash = hashStringToSeed('tds0Q5i__n4r2jYrf8JQB_p2z|ucom')
	const differentHash = hashStringToSeed('tds9A1x__k8m4pLqw2ZXC_q1w|ucom')

	expect(firstHash).toBe(secondHash)
	expect(firstHash).not.toBe(differentHash)
	expect(firstHash).toBeGreaterThanOrEqual(0)
	expect(firstHash).toBeLessThanOrEqual(0xffffffff)
	expect(Number.isInteger(firstHash)).toBe(true)
})

test('createSeededRandom produces deterministic floating-point sequences in [0, 1)', () => {
	const seed = hashStringToSeed('planet-seed-alpha')
	const firstGenerator = createSeededRandom(seed)
	const secondGenerator = createSeededRandom(seed)

	const firstSequence = Array.from({ length: 8 }, () => firstGenerator())
	const secondSequence = Array.from({ length: 8 }, () => secondGenerator())

	expect(firstSequence).toEqual(secondSequence)
	for (const randomValue of firstSequence) {
		expect(randomValue).toBeGreaterThanOrEqual(0)
		expect(randomValue).toBeLessThan(1)
	}
})

test('sampleSimplexNoise2D and sampleFractalNoise2D return deterministic bounded values in [-1, 1]', () => {
	const seed = hashStringToSeed('terrestrial-continent-seed')
	const singleSampleA = sampleSimplexNoise2D(1.25, -0.75, seed)
	const singleSampleB = sampleSimplexNoise2D(1.25, -0.75, seed)
	const fractalSample = sampleFractalNoise2D(2.4, 3.1, seed, 4)

	expect(singleSampleA).toBe(singleSampleB)
	expect(singleSampleA).toBeGreaterThanOrEqual(-1)
	expect(singleSampleA).toBeLessThanOrEqual(1)
	expect(fractalSample).toBeGreaterThanOrEqual(-1)
	expect(fractalSample).toBeLessThanOrEqual(1)
})

test('shouldApplyBayerDither steps cleanly across the 4x4 threshold matrix', () => {
	let litCountLow = 0
	let litCountHigh = 0

	for (let row = 0; row < 4; row++) {
		for (let column = 0; column < 4; column++) {
			if (shouldApplyBayerDither(column, row, 0.25)) {
				litCountLow++
			}
			if (shouldApplyBayerDither(column, row, 0.75)) {
				litCountHigh++
			}
		}
	}

	expect(litCountLow).toBe(4)
	expect(litCountHigh).toBe(12)
	expect(shouldApplyBayerDither(0, 0, 1)).toBe(true)
	expect(shouldApplyBayerDither(3, 3, 0)).toBe(false)
})

test('hashStringToSeed returns a deterministic non-zero fallback seed for an empty string', () => {
	const emptySeed = hashStringToSeed('')
	expect(Number.isFinite(emptySeed)).toBe(true)
	expect(emptySeed).toBeGreaterThan(0)
	expect(hashStringToSeed('')).toBe(emptySeed)
})

test('sampleFractalNoise2D returns 0 when octaveCount is zero or negative', () => {
	expect(sampleFractalNoise2D(1.5, 2.5, 12345, 0)).toBe(0)
	expect(sampleFractalNoise2D(1.5, 2.5, 12345, -2)).toBe(0)
})

test('procedural math functions clamp NaN, Infinity, and negative coordinates safely without throwing', () => {
	expect(Number.isFinite(sampleSimplexNoise2D(Number.NaN, Number.POSITIVE_INFINITY, Number.NaN))).toBe(true)
	expect(Number.isFinite(sampleFractalNoise2D(Number.NEGATIVE_INFINITY, Number.NaN, -999, 3))).toBe(true)
	expect(shouldApplyBayerDither(-5, -11, -2)).toBe(false)
	expect(shouldApplyBayerDither(Number.NaN, Number.POSITIVE_INFINITY, 5)).toBe(true)
})
