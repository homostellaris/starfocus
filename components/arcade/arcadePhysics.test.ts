import { expect, test } from 'bun:test'
import {
	calculateSlingshotImpulse,
	detectProjectileCollisions,
	spawnHardpointProjectiles,
	stepShipPhysics,
} from './arcadePhysics'
import SpaceArcadeCanvas from './SpaceArcadeCanvas'

test('stepShipPhysics accelerates along ship heading and applies inertial damping within sector bounds', () => {
	const initialState = {
		x: 200,
		y: 300,
		velocityX: 0,
		velocityY: 0,
		angleDegrees: 0,
		recoilOffsetPx: 2,
		shotsFired: 1,
	}

	const nextState = stepShipPhysics(
		initialState,
		{
			thrustForward: true,
			turnLeft: false,
			turnRight: false,
		},
		0.05,
		{ width: 800, height: 600 },
	)

	expect(nextState.velocityY).toBeLessThan(0)
	expect(nextState.y).toBeLessThan(initialState.y)
	expect(nextState.recoilOffsetPx).toBeLessThan(initialState.recoilOffsetPx)
})

test('calculateSlingshotImpulse computes launch velocity vector opposite to pull-back drag', () => {
	const impulse = calculateSlingshotImpulse(
		{ startX: 100, startY: 200 },
		{ currentX: 100, currentY: 260 },
	)

	expect(impulse).not.toBeNull()
	expect(impulse!.vx).toBeCloseTo(0, 2)
	expect(impulse!.vy).toBeLessThan(-100)
})

test('spawnHardpointProjectiles creates twin wing-hardpoint plasma bolts and sets recoilOffsetPx to 2', () => {
	const shipState = {
		x: 400,
		y: 300,
		velocityX: 0,
		velocityY: 0,
		angleDegrees: 0,
		recoilOffsetPx: 0,
		shotsFired: 0,
	}

	const result = spawnHardpointProjectiles(shipState, '#45D9FD')
	expect(result.projectiles.length).toBe(2)
	expect(result.nextShipState.recoilOffsetPx).toBe(2)
	expect(result.nextShipState.shotsFired).toBe(1)
})

test('detectProjectileCollisions registers hits when projectiles intersect planet node radii', () => {
	const projectiles = [
		{
			id: 'shot-1',
			x: 250,
			y: 250,
			velocityX: 0,
			velocityY: -300,
			radius: 4,
			color: '#FFB703',
			remainingLifeSeconds: 1.2,
		},
	]
	const planets = [
		{
			todoId: 'todo-target-1',
			title: 'Deploy orbital array',
			starPoints: 8,
			x: 255,
			y: 252,
			radius: 28,
			spec: {} as any,
			hitPoints: 3,
			maxHitPoints: 3,
			destroyedSubtasks: 0,
		},
	]

	const outcome = detectProjectileCollisions(projectiles, planets)
	expect(outcome.hitTodoIds).toEqual(['todo-target-1'])
	expect(outcome.survivingProjectiles.length).toBe(0)
	expect(outcome.updatedPlanets[0].hitPoints).toBe(2)
})

test('SpaceArcadeCanvas renders with arcade telemetry data attributes', () => {
	const element = SpaceArcadeCanvas({
		active: true,
		todos: [
			{
				id: 'todo-arcade-1',
				title: 'Explore sector',
				starPoints: 5,
			},
		],
	})

	expect(element.props['data-testid']).toBe('space-arcade-canvas')
	expect(element.props['data-arcade-active']).toBe('true')
	expect(element.props['data-planet-count']).toBe(1)
})

test('calculateSlingshotImpulse returns null when pullback distance is below threshold (< 18px)', () => {
	const tinyPull = calculateSlingshotImpulse(
		{ startX: 100, startY: 200 },
		{ currentX: 105, currentY: 208 },
	)
	expect(tinyPull).toBeNull()
})

test('stepShipPhysics clamps huge deltaSeconds (tab backgrounding) to 0.1s and wraps out-of-bounds coordinates', () => {
	const initialState = {
		x: -50,
		y: 950,
		velocityX: 200,
		velocityY: -200,
		angleDegrees: 45,
		recoilOffsetPx: 0,
		shotsFired: 0,
	}

	const nextState = stepShipPhysics(
		initialState,
		{ thrustForward: true, turnLeft: false, turnRight: false },
		10.0,
		{ width: 800, height: 600 },
	)

	expect(nextState.x).toBeGreaterThanOrEqual(0)
	expect(nextState.x).toBeLessThanOrEqual(800)
	expect(nextState.y).toBeGreaterThanOrEqual(0)
	expect(nextState.y).toBeLessThanOrEqual(600)
})
