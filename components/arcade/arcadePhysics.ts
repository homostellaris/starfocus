import type { StarRole, Todo } from '../db'
import { generateProceduralPlanetSpec } from '../assets/planetGenerator'
import { createSeededRandom, hashStringToSeed } from '../assets/proceduralMath'
import type {
	ArcadePlanetNode,
	ArcadeProjectile,
	ArcadeShipState,
} from '../assets/types'

export const MIN_SLINGSHOT_PULL_DISTANCE_PX = 18
export const MAX_SLINGSHOT_PULL_DISTANCE_PX = 140

export function stepShipPhysics(
	state: ArcadeShipState,
	controls: {
		thrustForward: boolean
		turnLeft: boolean
		turnRight: boolean
	},
	deltaSeconds: number,
	bounds: { width: number; height: number },
): ArcadeShipState {
	const clampedDelta = Number.isFinite(deltaSeconds)
		? Math.max(0, Math.min(0.1, deltaSeconds))
		: 0
	const safeWidth =
		Number.isFinite(bounds.width) && bounds.width > 0 ? bounds.width : 800
	const safeHeight =
		Number.isFinite(bounds.height) && bounds.height > 0 ? bounds.height : 600

	let angleDegrees = Number.isFinite(state.angleDegrees)
		? state.angleDegrees
		: 0
	const turnRateDegreesPerSecond = 220
	if (controls.turnLeft) {
		angleDegrees -= turnRateDegreesPerSecond * clampedDelta
	}
	if (controls.turnRight) {
		angleDegrees += turnRateDegreesPerSecond * clampedDelta
	}
	angleDegrees = ((angleDegrees % 360) + 360) % 360

	const angleRadians = (angleDegrees * Math.PI) / 180
	const headingX = Math.sin(angleRadians)
	const headingY = -Math.cos(angleRadians)

	let velocityX = Number.isFinite(state.velocityX) ? state.velocityX : 0
	let velocityY = Number.isFinite(state.velocityY) ? state.velocityY : 0

	if (controls.thrustForward) {
		const thrustAcceleration = 380
		velocityX += headingX * thrustAcceleration * clampedDelta
		velocityY += headingY * thrustAcceleration * clampedDelta
	}

	const dampingFactor = Math.pow(0.96, clampedDelta * 60)
	velocityX *= dampingFactor
	velocityY *= dampingFactor

	const maxSpeed = 420
	const speed = Math.hypot(velocityX, velocityY)
	if (speed > maxSpeed) {
		velocityX = (velocityX / speed) * maxSpeed
		velocityY = (velocityY / speed) * maxSpeed
	}

	const rawX = (Number.isFinite(state.x) ? state.x : safeWidth / 2) + velocityX * clampedDelta
	const rawY = (Number.isFinite(state.y) ? state.y : safeHeight / 2) + velocityY * clampedDelta

	const wrappedX = ((rawX % safeWidth) + safeWidth) % safeWidth
	const wrappedY = ((rawY % safeHeight) + safeHeight) % safeHeight

	const currentRecoil = Number.isFinite(state.recoilOffsetPx)
		? state.recoilOffsetPx
		: 0
	const nextRecoil = Math.max(0, Number((currentRecoil - 14 * clampedDelta).toFixed(3)))

	return {
		x: wrappedX,
		y: wrappedY,
		velocityX,
		velocityY,
		angleDegrees,
		recoilOffsetPx: nextRecoil,
		shotsFired: state.shotsFired,
	}
}

export function calculateSlingshotImpulse(
	origin: { startX: number; startY: number },
	current: { currentX: number; currentY: number },
): {
	vx: number
	vy: number
	angleDegrees: number
	pullDistance: number
} | null {
	const pullDeltaX = current.currentX - origin.startX
	const pullDeltaY = current.currentY - origin.startY
	const pullDistance = Math.hypot(pullDeltaX, pullDeltaY)

	if (
		!Number.isFinite(pullDistance) ||
		pullDistance < MIN_SLINGSHOT_PULL_DISTANCE_PX
	) {
		return null
	}

	const effectiveDistance = Math.min(
		MAX_SLINGSHOT_PULL_DISTANCE_PX,
		pullDistance,
	)
	const launchSpeed = effectiveDistance * 3.4
	const unitX = -pullDeltaX / pullDistance
	const unitY = -pullDeltaY / pullDistance
	const vx = unitX * launchSpeed
	const vy = unitY * launchSpeed
	const angleDegrees = ((Math.atan2(vx, -vy) * 180) / Math.PI + 360) % 360

	return {
		vx,
		vy,
		angleDegrees,
		pullDistance,
	}
}

export function spawnHardpointProjectiles(
	shipState: ArcadeShipState,
	boltColor = '#45D9FD',
): {
	projectiles: ArcadeProjectile[]
	nextShipState: ArcadeShipState
} {
	const angleRadians = (shipState.angleDegrees * Math.PI) / 180
	const forwardX = Math.sin(angleRadians)
	const forwardY = -Math.cos(angleRadians)
	const rightX = Math.cos(angleRadians)
	const rightY = Math.sin(angleRadians)

	const muzzleSpeed = 480
	const wingSpanOffset = 14
	const forwardMuzzleOffset = 10
	const nextShotNumber = (shipState.shotsFired || 0) + 1

	const leftBolt: ArcadeProjectile = {
		id: `bolt-${nextShotNumber}-left`,
		x:
			shipState.x -
			rightX * wingSpanOffset +
			forwardX * forwardMuzzleOffset,
		y:
			shipState.y -
			rightY * wingSpanOffset +
			forwardY * forwardMuzzleOffset,
		velocityX: shipState.velocityX + forwardX * muzzleSpeed,
		velocityY: shipState.velocityY + forwardY * muzzleSpeed,
		radius: 3.5,
		color: boltColor,
		remainingLifeSeconds: 1.4,
	}

	const rightBolt: ArcadeProjectile = {
		id: `bolt-${nextShotNumber}-right`,
		x:
			shipState.x +
			rightX * wingSpanOffset +
			forwardX * forwardMuzzleOffset,
		y:
			shipState.y +
			rightY * wingSpanOffset +
			forwardY * forwardMuzzleOffset,
		velocityX: shipState.velocityX + forwardX * muzzleSpeed,
		velocityY: shipState.velocityY + forwardY * muzzleSpeed,
		radius: 3.5,
		color: boltColor,
		remainingLifeSeconds: 1.4,
	}

	return {
		projectiles: [leftBolt, rightBolt],
		nextShipState: {
			...shipState,
			recoilOffsetPx: 2,
			shotsFired: nextShotNumber,
		},
	}
}

export function detectProjectileCollisions(
	projectiles: ArcadeProjectile[],
	planets: ArcadePlanetNode[],
): {
	hitTodoIds: string[]
	survivingProjectiles: ArcadeProjectile[]
	updatedPlanets: ArcadePlanetNode[]
} {
	const hitTodoIds: string[] = []
	const survivingProjectiles: ArcadeProjectile[] = []
	const updatedPlanets = planets.map(planet => ({ ...planet }))

	for (const projectile of projectiles) {
		let didCollide = false
		for (const planet of updatedPlanets) {
			const distance = Math.hypot(
				projectile.x - planet.x,
				projectile.y - planet.y,
			)
			if (distance <= projectile.radius + planet.radius) {
				didCollide = true
				planet.hitPoints = Math.max(0, planet.hitPoints - 1)
				planet.destroyedSubtasks += 1
				if (!hitTodoIds.includes(planet.todoId)) {
					hitTodoIds.push(planet.todoId)
				}
				break
			}
		}
		if (!didCollide) {
			survivingProjectiles.push(projectile)
		}
	}

	return {
		hitTodoIds,
		survivingProjectiles,
		updatedPlanets,
	}
}

export function buildArcadePlanetNodes({
	todos,
	starRoles = [],
	anchoredPositions = {},
	bounds = { width: 900, height: 560 },
}: {
	todos: Todo[]
	starRoles?: StarRole[]
	anchoredPositions?: Record<string, { x: number; y: number }>
	bounds?: { width: number; height: number }
}): ArcadePlanetNode[] {
	const safeWidth = Math.max(320, bounds.width)
	const safeHeight = Math.max(260, bounds.height)

	return todos.slice(0, 18).map((todo, index) => {
		const role = starRoles.find(candidate => candidate.id === todo.starRole)
		const spec = generateProceduralPlanetSpec({
			todo,
			starRole: role,
		})
		const anchored = anchoredPositions[todo.id]
		const prng = createSeededRandom(hashStringToSeed(`${todo.id}:${index}`))

		const columnCount = Math.min(4, Math.max(2, Math.ceil(Math.sqrt(todos.length))))
		const columnIndex = index % columnCount
		const rowIndex = Math.floor(index / columnCount)
		const rowCount = Math.max(1, Math.ceil(Math.min(todos.length, 18) / columnCount))

		const defaultX =
			90 +
			((columnIndex + 0.5) / columnCount) * (safeWidth - 180) +
			(prng() - 0.5) * 36
		const defaultY =
			80 +
			((rowIndex + 0.5) / rowCount) * (safeHeight - 160) +
			(prng() - 0.5) * 28

		const radius =
			spec.celestialClass === 'black_hole'
				? 36
				: spec.celestialClass === 'star'
					? 33
					: spec.celestialClass === 'gas_giant'
						? 30
						: spec.celestialClass === 'terrestrial'
							? 25
							: spec.celestialClass === 'dwarf_planet'
								? 21
								: 18
		const clampedPoints = Math.min(13, Math.max(1, todo.starPoints || 1))
		const maxHitPoints = Math.max(1, Math.min(7, Math.ceil(clampedPoints / 2)))

		return {
			todoId: todo.id,
			title: todo.title,
			starPoints: clampedPoints,
			x: anchored ? anchored.x : defaultX,
			y: anchored ? anchored.y : defaultY,
			radius,
			spec,
			hitPoints: maxHitPoints,
			maxHitPoints,
			destroyedSubtasks: 0,
		}
	})
}
