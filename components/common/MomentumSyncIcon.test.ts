import { expect, test } from 'bun:test'
import {
	calculateNextVelocity,
	calculateNextAngle,
	determineMomentumPhase,
	resolvePixelSize,
	GLOW_COLOR_STYLES,
	type MomentumGlowColor,
} from './MomentumSyncIcon'

// Happy path tests
test('glow color palette returns expected celestial styles for cyan, blue, purple, and amber', () => {
	const supportedColors: MomentumGlowColor[] = [
		'cyan',
		'blue',
		'purple',
		'amber',
	]

	for (const color of supportedColors) {
		const style = GLOW_COLOR_STYLES[color]
		expect(style).toBeDefined()
		expect(style.activeColor).toBeString()
		expect(style.dropShadow).toContain('drop-shadow')
		expect(style.haloBackground).toBeString()
	}
})

test('resolvePixelSize maps semantic size tokens to correct pixel dimensions', () => {
	expect(resolvePixelSize('sm')).toBe(16)
	expect(resolvePixelSize('md')).toBe(20)
	expect(resolvePixelSize('lg')).toBe(32)
	expect(resolvePixelSize('xl')).toBe(48)
	expect(resolvePixelSize(64)).toBe(64)
})

test('calculateNextVelocity accelerates when impulse is required', () => {
	const initialVelocity = 0
	const maxVelocity = 540
	const accelerationRate = 960
	const deltaSeconds = 0.05

	const nextVelocity = calculateNextVelocity({
		currentVelocity: initialVelocity,
		requiresImpulse: true,
		maxVelocity,
		accelerationRate,
		frictionCoefficient: 2.4,
		deltaSeconds,
	})

	expect(nextVelocity).toBe(48) // 0 + 960 * 0.05 = 48
	expect(nextVelocity).toBeLessThanOrEqual(maxVelocity)
})

test('calculateNextVelocity clamps acceleration at maxVelocity', () => {
	const initialVelocity = 530
	const maxVelocity = 540
	const accelerationRate = 960
	const deltaSeconds = 0.05

	const nextVelocity = calculateNextVelocity({
		currentVelocity: initialVelocity,
		requiresImpulse: true,
		maxVelocity,
		accelerationRate,
		frictionCoefficient: 2.4,
		deltaSeconds,
	})

	expect(nextVelocity).toBe(540)
})

test('calculateNextVelocity applies inertial drag decay when impulse ends', () => {
	const initialVelocity = 500
	const frictionCoefficient = 2.4
	const deltaSeconds = 0.1

	const nextVelocity = calculateNextVelocity({
		currentVelocity: initialVelocity,
		requiresImpulse: false,
		maxVelocity: 540,
		accelerationRate: 960,
		frictionCoefficient,
		deltaSeconds,
	})

	const expectedVelocity = initialVelocity * Math.exp(-frictionCoefficient * deltaSeconds)
	expect(Math.abs(nextVelocity - expectedVelocity)).toBeLessThan(0.001)
	expect(nextVelocity).toBeLessThan(initialVelocity)
	expect(nextVelocity).toBeGreaterThan(0)
})

test('calculateNextAngle accumulates rotation angle with modulo 360 wrap', () => {
	expect(calculateNextAngle(0, 360, 0.05)).toBe(18)
	expect(calculateNextAngle(350, 360, 0.05)).toBe(8) // (350 + 18) % 360 = 8
})

test('determineMomentumPhase identifies accelerating, cruising, coasting, and idle', () => {
	expect(
		determineMomentumPhase({
			requiresImpulse: true,
			velocity: 100,
			maxVelocity: 500,
		}),
	).toBe('accelerating')

	expect(
		determineMomentumPhase({
			requiresImpulse: true,
			velocity: 480,
			maxVelocity: 500,
		}),
	).toBe('cruising')

	expect(
		determineMomentumPhase({
			requiresImpulse: false,
			velocity: 250,
			maxVelocity: 500,
		}),
	).toBe('coasting')

	expect(
		determineMomentumPhase({
			requiresImpulse: false,
			velocity: 0.5,
			maxVelocity: 500,
		}),
	).toBe('idle')
})

// Sad path tests
test('calculateNextVelocity handles zero velocity gracefully when coasting', () => {
	const nextVelocity = calculateNextVelocity({
		currentVelocity: 0,
		requiresImpulse: false,
		maxVelocity: 540,
		accelerationRate: 960,
		frictionCoefficient: 2.4,
		deltaSeconds: 0.05,
	})

	expect(nextVelocity).toBe(0)
})

test('resolvePixelSize returns undefined for invalid size strings', () => {
	// @ts-expect-error testing invalid size token
	expect(resolvePixelSize('unknown')).toBeUndefined()
})

// Bad path tests
test('calculateNextVelocity caps deltaSeconds to 0.1s to prevent physics explosion if browser tab was backgrounded', () => {
	const initialVelocity = 0
	const hugeDeltaSeconds = 10.0 // simulate 10 second delay

	const nextVelocity = calculateNextVelocity({
		currentVelocity: initialVelocity,
		requiresImpulse: true,
		maxVelocity: 540,
		accelerationRate: 960,
		frictionCoefficient: 2.4,
		deltaSeconds: hugeDeltaSeconds,
	})

	// Capped to 0.1s: 0 + 960 * 0.1 = 96
	expect(nextVelocity).toBe(96)
})

test('calculateNextVelocity handles negative deltaSeconds by clamping to zero', () => {
	const initialVelocity = 100

	const nextVelocity = calculateNextVelocity({
		currentVelocity: initialVelocity,
		requiresImpulse: true,
		maxVelocity: 540,
		accelerationRate: 960,
		frictionCoefficient: 2.4,
		deltaSeconds: -1.0,
	})

	expect(nextVelocity).toBe(initialVelocity)
})
