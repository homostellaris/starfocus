import { expect, test } from 'bun:test'
import MomentumSettingsIcon, { calculateRatchetProgress } from './MomentumSettingsIcon'

test('calculateRatchetProgress produces zero at start and 1 at completion', () => {
	expect(calculateRatchetProgress(0, 300)).toBe(0)
	expect(calculateRatchetProgress(300, 300)).toBe(1)
	expect(calculateRatchetProgress(500, 300)).toBe(1)
	expect(calculateRatchetProgress(-10, 300)).toBe(0)
})

test('calculateRatchetProgress demonstrates crisp mechanical pawl overshoot and settle', () => {
	const midpointProgress = calculateRatchetProgress(150, 300)
	expect(midpointProgress).toBeGreaterThan(1.0)
	expect(midpointProgress).toBeLessThan(1.1)
})
import {
	calculateNextAngle,
	calculateNextVelocity,
	determineMomentumPhase,
	resolvePixelSize,
} from './MomentumSyncIcon'

test('resolvePixelSize maps semantic size tokens to correct pixel dimensions', () => {
	expect(resolvePixelSize('sm')).toBe(16)
	expect(resolvePixelSize('md')).toBe(20)
	expect(resolvePixelSize('lg')).toBe(32)
	expect(resolvePixelSize('xl')).toBe(48)
	expect(resolvePixelSize(28)).toBe(28)
	expect(resolvePixelSize(undefined)).toBeUndefined()
})

test('calculateNextVelocity accelerates when settings menu opens and impulse is required', () => {
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

	expect(nextVelocity).toBe(48)
	expect(nextVelocity).toBeLessThanOrEqual(maxVelocity)
})

test('calculateNextVelocity clamps acceleration at maxVelocity while menu stays open', () => {
	const nextVelocity = calculateNextVelocity({
		currentVelocity: 535,
		requiresImpulse: true,
		maxVelocity: 540,
		accelerationRate: 960,
		frictionCoefficient: 2.4,
		deltaSeconds: 0.05,
	})

	expect(nextVelocity).toBe(540)
})

test('calculateNextVelocity applies inertial drag decay when settings menu closes', () => {
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

	const expectedVelocity =
		initialVelocity * Math.exp(-frictionCoefficient * deltaSeconds)
	expect(Math.abs(nextVelocity - expectedVelocity)).toBeLessThan(0.001)
	expect(nextVelocity).toBeLessThan(initialVelocity)
	expect(nextVelocity).toBeGreaterThan(0)
})

test('calculateNextAngle accumulates rotation angle with modulo 360 wrap', () => {
	expect(calculateNextAngle(0, 360, 0.05)).toBe(18)
	expect(calculateNextAngle(350, 360, 0.05)).toBe(8)
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

test('MomentumSettingsIcon exports a valid React component function', () => {
	expect(typeof MomentumSettingsIcon).toBe('function')
	expect(MomentumSettingsIcon.name).toBe('MomentumSettingsIcon')
})

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

test('calculateNextVelocity caps deltaSeconds to 0.1s to prevent physics explosion if tab was backgrounded', () => {
	const initialVelocity = 0
	const hugeDeltaSeconds = 10.0

	const nextVelocity = calculateNextVelocity({
		currentVelocity: initialVelocity,
		requiresImpulse: true,
		maxVelocity: 540,
		accelerationRate: 960,
		frictionCoefficient: 2.4,
		deltaSeconds: hugeDeltaSeconds,
	})

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
