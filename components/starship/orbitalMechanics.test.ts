import { describe, expect, test } from 'bun:test'
import {
	computeOrbitalState,
	FLIGHT_STAGING_MODES,
} from './orbitalMechanics'

describe('orbitalMechanics', () => {
	test('defines all 4 showcase flight staging modes with metadata', () => {
		expect(FLIGHT_STAGING_MODES.length).toBe(4)
		const ids = FLIGHT_STAGING_MODES.map(mode => mode.id)
		expect(ids).toContain('kepler_orbit')
		expect(ids).toContain('lagrange_parking')
		expect(ids).toContain('gravity_flyby')
		expect(ids).toContain('dual_staging')
	})

	test('kepler_orbit traverses 2.5D elliptical coordinates with depth occlusion', () => {
		// Test at front of orbit (sin > 0)
		const frontState = computeOrbitalState({
			mode: 'kepler_orbit',
			elapsedSeconds: 1.4, // Quarter-period
		})
		expect(frontState.isBehind).toBe(false)
		expect(frontState.scale).toBeGreaterThan(0.85)
		expect(frontState.showOrbitGuide).toBe(true)

		// Test at back of orbit (sin < 0)
		const backState = computeOrbitalState({
			mode: 'kepler_orbit',
			elapsedSeconds: 4.2, // Three-quarters period
		})
		expect(backState.isBehind).toBe(true)
		expect(backState.scale).toBeLessThan(0.85)
		expect(backState.opacity).toBeLessThan(1)

		// Coordinates remain within the 56px gutter boundary (radial offset <= 26px)
		expect(Math.abs(frontState.offsetX)).toBeLessThanOrEqual(26)
		expect(Math.abs(frontState.offsetY)).toBeLessThanOrEqual(26)
	})

	test('lagrange_parking holds station at L4 equilibrium with scanner beam', () => {
		const state = computeOrbitalState({
			mode: 'lagrange_parking',
			elapsedSeconds: 2.0,
		})
		expect(state.isBehind).toBe(false)
		expect(state.scannerBeamTarget).toEqual({ x: 0, y: 0 })
		expect(state.offsetX).toBeLessThan(-18) // Off upper-left shoulder
		expect(state.offsetY).toBeLessThan(-10)
	})

	test('gravity_flyby executes accelerated eccentric loop', () => {
		const state1 = computeOrbitalState({
			mode: 'gravity_flyby',
			elapsedSeconds: 0,
		})
		const state2 = computeOrbitalState({
			mode: 'gravity_flyby',
			elapsedSeconds: 2.5,
		})
		expect(state1.offsetX).not.toEqual(state2.offsetX)
		expect(state1.showOrbitGuide).toBe(true)
	})

	test('dual_staging adapts between kepler orbit in portrait and wide corridor in landscape', () => {
		const portraitState = computeOrbitalState({
			mode: 'dual_staging',
			elapsedSeconds: 1.0,
			isLandscape: false,
		})
		const landscapeState = computeOrbitalState({
			mode: 'dual_staging',
			elapsedSeconds: 1.0,
			isLandscape: true,
		})

		// In landscape, semi-major axis spans wider (up to 48px)
		expect(Math.abs(landscapeState.offsetX)).toBeGreaterThan(
			Math.abs(portraitState.offsetX),
		)
	})

	test('resets offsets to zero when user is actively dragging slingshot', () => {
		const state = computeOrbitalState({
			mode: 'kepler_orbit',
			elapsedSeconds: 3.5,
			isDragging: true,
		})
		expect(state.offsetX).toBe(0)
		expect(state.offsetY).toBe(0)
		expect(state.scale).toBe(1)
		expect(state.isBehind).toBe(false)
	})
})
