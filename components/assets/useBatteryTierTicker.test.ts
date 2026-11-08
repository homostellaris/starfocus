import { expect, test } from 'bun:test'
import {
	MAX_PARTICLE_POOL_SIZE,
	createParticleRingPool,
	determineBatteryTier,
	resolveTargetFrameIntervalMs,
} from './useBatteryTierTicker'

test('determineBatteryTier selects active (60fps), battery_saver (30fps), and idle (0fps after 4s inactivity)', () => {
	const activeTier = determineBatteryTier({
		isArcadeActive: false,
		batterySaverEnabled: false,
		idleElapsedMs: 1200,
		idleThresholdMs: 4000,
	})
	expect(activeTier).toBe('active')
	expect(resolveTargetFrameIntervalMs(activeTier)).toBeCloseTo(16.67, 1)

	const batterySaverTier = determineBatteryTier({
		isArcadeActive: false,
		batterySaverEnabled: true,
		idleElapsedMs: 500,
		idleThresholdMs: 4000,
	})
	expect(batterySaverTier).toBe('battery_saver')
	expect(resolveTargetFrameIntervalMs(batterySaverTier)).toBeCloseTo(33.33, 1)

	const idleTier = determineBatteryTier({
		isArcadeActive: false,
		batterySaverEnabled: false,
		idleElapsedMs: 4200,
		idleThresholdMs: 4000,
	})
	expect(idleTier).toBe('idle')
	expect(resolveTargetFrameIntervalMs(idleTier)).toBe(0)
})

test('ParticleRingPool spawns, steps, and recycles particles within the 40-sprite cap', () => {
	const pool = createParticleRingPool()
	expect(pool.getCapacity()).toBe(MAX_PARTICLE_POOL_SIZE)
	expect(pool.getActiveCount()).toBe(0)

	pool.spawn({
		x: 100,
		y: 200,
		velocityX: 10,
		velocityY: -20,
		maxLife: 0.5,
		size: 2,
		color: '#45D9FD',
	})
	expect(pool.getActiveCount()).toBe(1)

	pool.step(0.25)
	expect(pool.getActiveCount()).toBe(1)

	pool.step(0.35)
	expect(pool.getActiveCount()).toBe(0)
})

test('determineBatteryTier never enters idle sleep mode while isArcadeActive is true', () => {
	const arcadeTier = determineBatteryTier({
		isArcadeActive: true,
		batterySaverEnabled: false,
		idleElapsedMs: 25000,
		idleThresholdMs: 4000,
	})
	expect(arcadeTier).toBe('active')
})

test('ParticleRingPool overwrites oldest ring buffer slots when spawning 200 particles in a burst without exceeding 40', () => {
	const pool = createParticleRingPool()
	for (let index = 0; index < 200; index++) {
		pool.spawn({
			x: index,
			y: index,
			velocityX: 1,
			velocityY: 1,
			maxLife: 2.0,
			size: 2,
			color: '#FFB703',
		})
	}

	expect(pool.getActiveCount()).toBe(40)
	expect(pool.getParticles().length).toBe(40)

	pool.step(-5)
	expect(pool.getActiveCount()).toBe(40)
})
