'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { StarRole, Todo } from '../db'
import {
	bakePlanetBitmap,
	getAdditiveGlowBitmap,
} from '../assets/planetGenerator'
import {
	paintModularShipToContext,
	resolveShipLoadout,
} from '../assets/shipAssembler'
import {
	createParticleRingPool,
	useBatteryTierTicker,
} from '../assets/useBatteryTierTicker'
import type {
	ArcadePlanetNode,
	ArcadeProjectile,
	ArcadeShipState,
	BatteryPerformanceTier,
	ShipLoadoutConfig,
} from '../assets/types'
import {
	buildArcadePlanetNodes,
	calculateSlingshotImpulse,
	detectProjectileCollisions,
	spawnHardpointProjectiles,
	stepShipPhysics,
} from './arcadePhysics'

export interface SpaceArcadeCanvasProps {
	active: boolean
	todos: Todo[]
	starRoles?: StarRole[]
	anchoredPositions?: Record<string, { x: number; y: number }>
	initialShipPosition?: { x: number; y: number; rotationDegrees?: number }
	initialVelocity?: { vx: number; vy: number }
	shipLoadout?: Partial<ShipLoadoutConfig>
	batteryTierOverride?: BatteryPerformanceTier
	onExitArcade?: () => void
	onSelectTodoPlanet?: (todoId: string) => void
	className?: string
}

export default function SpaceArcadeCanvas(props: SpaceArcadeCanvasProps) {
	if (typeof document === 'undefined') {
		const initialNodes = buildArcadePlanetNodes({
			todos: props.todos,
			starRoles: props.starRoles,
			anchoredPositions: props.anchoredPositions,
			bounds: { width: 920, height: 540 },
		})
		const tier = props.batteryTierOverride ?? 'active'
		const shipX = Math.round(props.initialShipPosition?.x ?? 160)
		const shipY = Math.round(props.initialShipPosition?.y ?? 260)
		const shipAngle = Math.round(
			props.initialShipPosition?.rotationDegrees ?? 0,
		)

		return (
			<div
				data-testid="space-arcade-canvas"
				data-arcade-active={String(props.active)}
				data-battery-tier={tier}
				data-planet-count={initialNodes.length}
				data-ship-x={shipX}
				data-ship-y={shipY}
				data-ship-angle={shipAngle}
				data-shots-fired={0}
				data-recoil-offset={0}
				className={`relative overflow-hidden rounded-xl border border-amber-500/30 bg-[#09090b]/95 ${props.className ?? ''}`}
			/>
		)
	}

	const sectorSignature = computeSectorSignature(props)
	return <SpaceArcadeInteractiveCanvas key={sectorSignature} {...props} />
}

const EMPTY_STAR_ROLES: StarRole[] = []
const EMPTY_ANCHORED_POSITIONS: Record<string, { x: number; y: number }> = {}

function computeSectorSignature(props: SpaceArcadeCanvasProps): string {
	const todoKey = props.todos
		.map(
			todo =>
				`${todo.id}:${todo.title}:${todo.starPoints ?? 0}:${todo.starRole ?? ''}`,
		)
		.join('|')
	const roleKey = (props.starRoles ?? EMPTY_STAR_ROLES)
		.map(role => `${role.id}:${role.title}`)
		.join('|')
	const anchorKey = Object.entries(
		props.anchoredPositions ?? EMPTY_ANCHORED_POSITIONS,
	)
		.map(
			([todoId, coords]) =>
				`${todoId}:${Math.round(coords.x)},${Math.round(coords.y)}`,
		)
		.join('|')
	const launchKey = `${props.initialShipPosition?.x ?? 160},${props.initialShipPosition?.y ?? 260},${props.initialShipPosition?.rotationDegrees ?? 0},${props.initialVelocity?.vx ?? 0},${props.initialVelocity?.vy ?? 0}`
	return `${todoKey}::${roleKey}::${anchorKey}::${launchKey}`
}

function SpaceArcadeInteractiveCanvas({
	active,
	todos,
	starRoles = EMPTY_STAR_ROLES,
	anchoredPositions = EMPTY_ANCHORED_POSITIONS,
	initialShipPosition,
	initialVelocity,
	shipLoadout,
	batteryTierOverride,
	onExitArcade,
	onSelectTodoPlanet,
	className = '',
}: SpaceArcadeCanvasProps) {
	const resolvedLoadout = useMemo(
		() => resolveShipLoadout(shipLoadout),
		[shipLoadout],
	)
	const { telemetry, thrusterFrame } = useBatteryTierTicker({
		isArcadeActive: active,
		tierOverride: batteryTierOverride,
	})

	const initialNodes = useMemo(
		() =>
			buildArcadePlanetNodes({
				todos,
				starRoles,
				anchoredPositions,
				bounds: { width: 920, height: 540 },
			}),
		[todos, starRoles, anchoredPositions],
	)

	const [planetNodes, setPlanetNodes] =
		useState<ArcadePlanetNode[]>(initialNodes)
	const [shipState, setShipState] = useState<ArcadeShipState>(() => ({
		x: initialShipPosition?.x ?? 160,
		y: initialShipPosition?.y ?? 260,
		velocityX: initialVelocity?.vx ?? 0,
		velocityY: initialVelocity?.vy ?? 0,
		angleDegrees: initialShipPosition?.rotationDegrees ?? 0,
		recoilOffsetPx: 0,
		shotsFired: 0,
	}))
	const [lastHitTodoTitle, setLastHitTodoTitle] = useState<string | null>(null)
	const [slingshotPull, setSlingshotPull] = useState<{
		startX: number
		startY: number
		currentX: number
		currentY: number
	} | null>(null)
	const slingshotPullRef = useRef<{
		startX: number
		startY: number
		currentX: number
		currentY: number
	} | null>(null)

	const planetNodesRef = useRef<ArcadePlanetNode[]>(planetNodes)
	const shipStateRef = useRef<ArcadeShipState>(shipState)
	const onSelectTodoPlanetRef = useRef(onSelectTodoPlanet)
	const projectilesRef = useRef<ArcadeProjectile[]>([])
	const particlePoolRef = useRef(createParticleRingPool())
	const controlsRef = useRef({
		thrustForward: false,
		turnLeft: false,
		turnRight: false,
	})
	const canvasRef = useRef<HTMLCanvasElement | null>(null)

	useEffect(() => {
		planetNodesRef.current = planetNodes
	}, [planetNodes])

	useEffect(() => {
		shipStateRef.current = shipState
	}, [shipState])

	useEffect(() => {
		onSelectTodoPlanetRef.current = onSelectTodoPlanet
	}, [onSelectTodoPlanet])

	const triggerFireHardpoints = useCallback(() => {
		setShipState(previous => {
			const { projectiles, nextShipState } = spawnHardpointProjectiles(
				previous,
				resolvedLoadout.palette.cockpitGlow,
			)
			projectilesRef.current = [...projectilesRef.current, ...projectiles]
			shipStateRef.current = nextShipState
			return nextShipState
		})
	}, [resolvedLoadout.palette.cockpitGlow])

	const triggerThrustStep = useCallback(
		(direction: 'thrust' | 'left' | 'right') => {
			setShipState(previous => {
				const stepped = stepShipPhysics(
					previous,
					{
						thrustForward: direction === 'thrust',
						turnLeft: direction === 'left',
						turnRight: direction === 'right',
					},
					0.06,
					{ width: 920, height: 540 },
				)
				shipStateRef.current = stepped
				return stepped
			})
		},
		[],
	)

	useEffect(() => {
		if (typeof window === 'undefined') return

		const handleWindowPointerMove = (event: PointerEvent) => {
			if (!slingshotPullRef.current) return
			const nextPull = {
				...slingshotPullRef.current,
				currentX: event.clientX,
				currentY: event.clientY,
			}
			slingshotPullRef.current = nextPull
			setSlingshotPull(nextPull)
		}

		const handleWindowPointerUp = (event: PointerEvent) => {
			const activePull = slingshotPullRef.current
			if (!activePull) return
			slingshotPullRef.current = null
			setSlingshotPull(null)

			const impulse = calculateSlingshotImpulse(
				{ startX: activePull.startX, startY: activePull.startY },
				{ currentX: event.clientX, currentY: event.clientY },
			)
			if (impulse) {
				setShipState(previous => {
					const launched: ArcadeShipState = {
						...previous,
						velocityX: impulse.vx,
						velocityY: impulse.vy,
						angleDegrees: impulse.angleDegrees,
					}
					shipStateRef.current = launched
					return launched
				})
			} else {
				triggerFireHardpoints()
			}
		}

		window.addEventListener('pointermove', handleWindowPointerMove)
		window.addEventListener('pointerup', handleWindowPointerUp)
		window.addEventListener('pointercancel', handleWindowPointerUp)

		return () => {
			window.removeEventListener('pointermove', handleWindowPointerMove)
			window.removeEventListener('pointerup', handleWindowPointerUp)
			window.removeEventListener('pointercancel', handleWindowPointerUp)
		}
	}, [triggerFireHardpoints])

	useEffect(() => {
		if (!active || typeof window === 'undefined') return

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				event.preventDefault()
				onExitArcade?.()
				return
			}
			if (event.key === 'w' || event.key === 'W' || event.key === 'ArrowUp') {
				controlsRef.current.thrustForward = true
				triggerThrustStep('thrust')
			}
			if (event.key === 'a' || event.key === 'A' || event.key === 'ArrowLeft') {
				controlsRef.current.turnLeft = true
				triggerThrustStep('left')
			}
			if (
				event.key === 'd' ||
				event.key === 'D' ||
				event.key === 'ArrowRight'
			) {
				controlsRef.current.turnRight = true
				triggerThrustStep('right')
			}
			if (event.key === ' ') {
				event.preventDefault()
				triggerFireHardpoints()
			}
		}

		const handleKeyUp = (event: KeyboardEvent) => {
			if (event.key === 'w' || event.key === 'W' || event.key === 'ArrowUp') {
				controlsRef.current.thrustForward = false
			}
			if (event.key === 'a' || event.key === 'A' || event.key === 'ArrowLeft') {
				controlsRef.current.turnLeft = false
			}
			if (
				event.key === 'd' ||
				event.key === 'D' ||
				event.key === 'ArrowRight'
			) {
				controlsRef.current.turnRight = false
			}
		}

		window.addEventListener('keydown', handleKeyDown)
		window.addEventListener('keyup', handleKeyUp)
		return () => {
			window.removeEventListener('keydown', handleKeyDown)
			window.removeEventListener('keyup', handleKeyUp)
		}
	}, [active, onExitArcade, triggerFireHardpoints, triggerThrustStep])

	useEffect(() => {
		if (!active || typeof window === 'undefined') return
		if (telemetry.tier === 'idle') return

		const intervalMs = telemetry.tier === 'battery_saver' ? 33 : 16
		const deltaSeconds = intervalMs / 1000

		const timerId = window.setInterval(() => {
			const previousShip = shipStateRef.current
			const steppedShip = stepShipPhysics(
				previousShip,
				controlsRef.current,
				deltaSeconds,
				{ width: 920, height: 540 },
			)
			shipStateRef.current = steppedShip

			const isMovingFast =
				Math.hypot(steppedShip.velocityX, steppedShip.velocityY) > 45

			if (
				(controlsRef.current.thrustForward || isMovingFast) &&
				telemetry.tier === 'active'
			) {
				const angleRad = (steppedShip.angleDegrees * Math.PI) / 180
				particlePoolRef.current.spawn({
					x: steppedShip.x - Math.sin(angleRad) * 20,
					y: steppedShip.y + Math.cos(angleRad) * 20,
					velocityX: -Math.sin(angleRad) * 70 + (Math.random() - 0.5) * 25,
					velocityY: Math.cos(angleRad) * 70 + (Math.random() - 0.5) * 25,
					maxLife: 0.45,
					size: 2.5,
					color: resolvedLoadout.palette.thrusterPlume,
				})
			}

			if (projectilesRef.current.length > 0) {
				const movedProjectiles = projectilesRef.current
					.map(bolt => ({
						...bolt,
						x: bolt.x + bolt.velocityX * deltaSeconds,
						y: bolt.y + bolt.velocityY * deltaSeconds,
						remainingLifeSeconds: bolt.remainingLifeSeconds - deltaSeconds,
					}))
					.filter(bolt => bolt.remainingLifeSeconds > 0)

				const collisionOutcome = detectProjectileCollisions(
					movedProjectiles,
					planetNodesRef.current,
				)
				projectilesRef.current = collisionOutcome.survivingProjectiles

				if (collisionOutcome.hitTodoIds.length > 0) {
					planetNodesRef.current = collisionOutcome.updatedPlanets
					setPlanetNodes(collisionOutcome.updatedPlanets)
					const hitNode = collisionOutcome.updatedPlanets.find(
						node => node.todoId === collisionOutcome.hitTodoIds[0],
					)
					if (hitNode) {
						setLastHitTodoTitle(hitNode.title)
						onSelectTodoPlanetRef.current?.(hitNode.todoId)
					}
				}
			}

			particlePoolRef.current.step(deltaSeconds)

			const shipChanged =
				Math.round(steppedShip.x) !== Math.round(previousShip.x) ||
				Math.round(steppedShip.y) !== Math.round(previousShip.y) ||
				Math.round(steppedShip.angleDegrees) !==
					Math.round(previousShip.angleDegrees) ||
				steppedShip.recoilOffsetPx !== previousShip.recoilOffsetPx ||
				steppedShip.shotsFired !== previousShip.shotsFired

			if (shipChanged) {
				setShipState(steppedShip)
			}
		}, intervalMs)

		return () => window.clearInterval(timerId)
	}, [active, resolvedLoadout.palette.thrusterPlume, telemetry.tier])

	useEffect(() => {
		const canvasElement = canvasRef.current
		if (!canvasElement) return
		const context = canvasElement.getContext('2d')
		if (!context) return

		context.clearRect(0, 0, canvasElement.width, canvasElement.height)

		for (const node of planetNodes) {
			const baked = bakePlanetBitmap(node.spec, { enableDithering: true })
			const drawDiameter = node.radius * 2.2

			if (
				node.spec.celestialClass !== 'asteroid' &&
				node.spec.celestialClass !== 'dwarf_planet'
			) {
				const glowBitmap = getAdditiveGlowBitmap(
					node.spec.palette.emissiveOrAtmos,
					64,
				)
				if (glowBitmap) {
					context.save()
					context.globalCompositeOperation = 'lighter'
					context.drawImage(
						glowBitmap,
						node.x - drawDiameter * 0.65,
						node.y - drawDiameter * 0.65,
						drawDiameter * 1.3,
						drawDiameter * 1.3,
					)
					context.restore()
				}
			}

			if (baked.canvas) {
				context.drawImage(
					baked.canvas,
					node.x - drawDiameter / 2,
					node.y - drawDiameter / 2,
					drawDiameter,
					drawDiameter,
				)
			}

			context.save()
			context.fillStyle = '#f8fafc'
			context.font = '600 11px ui-monospace, SFMono-Regular, monospace'
			context.textAlign = 'center'
			const truncatedTitle =
				node.title.length > 24 ? `${node.title.slice(0, 22)}…` : node.title
			context.fillText(
				`[${node.starPoints}pt] ${truncatedTitle}`,
				node.x,
				node.y + node.radius + 18,
			)
			context.restore()
		}

		for (const particle of particlePoolRef.current.getParticles()) {
			if (!particle.active) continue
			context.save()
			context.globalCompositeOperation = 'lighter'
			context.fillStyle = particle.color
			context.globalAlpha = Math.max(
				0.15,
				particle.lifeRemaining / particle.maxLife,
			)
			context.beginPath()
			context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
			context.fill()
			context.restore()
		}

		for (const projectile of projectilesRef.current) {
			context.save()
			context.globalCompositeOperation = 'lighter'
			context.fillStyle = projectile.color
			context.beginPath()
			context.arc(
				projectile.x,
				projectile.y,
				projectile.radius,
				0,
				Math.PI * 2,
			)
			context.fill()
			context.restore()
		}

		if (slingshotPull) {
			const pullDeltaX = slingshotPull.currentX - slingshotPull.startX
			const pullDeltaY = slingshotPull.currentY - slingshotPull.startY
			const pullDistance = Math.hypot(pullDeltaX, pullDeltaY)
			if (pullDistance >= 8) {
				const clampedPull = Math.min(120, pullDistance)
				const unitX = -pullDeltaX / pullDistance
				const unitY = -pullDeltaY / pullDistance

				context.save()
				context.strokeStyle = 'rgba(251, 191, 36, 0.75)'
				context.lineWidth = 2
				context.setLineDash([5, 4])
				context.beginPath()
				context.moveTo(shipState.x, shipState.y)
				context.lineTo(
					shipState.x - unitX * clampedPull * 0.7,
					shipState.y - unitY * clampedPull * 0.7,
				)
				context.stroke()

				context.strokeStyle = '#38bdf8'
				context.lineWidth = 2.5
				context.setLineDash([])
				context.beginPath()
				context.moveTo(shipState.x, shipState.y)
				context.lineTo(
					shipState.x + unitX * clampedPull * 1.15,
					shipState.y + unitY * clampedPull * 1.15,
				)
				context.stroke()
				context.restore()
			}
		}

		const displayAngle = (() => {
			if (!slingshotPull) return shipState.angleDegrees
			const impulse = calculateSlingshotImpulse(
				{ startX: slingshotPull.startX, startY: slingshotPull.startY },
				{ currentX: slingshotPull.currentX, currentY: slingshotPull.currentY },
			)
			return impulse ? impulse.angleDegrees : shipState.angleDegrees
		})()

		context.save()
		context.translate(shipState.x, shipState.y)
		context.rotate((displayAngle * Math.PI) / 180)
		context.translate(-32, -32)
		paintModularShipToContext({
			context,
			loadout: resolvedLoadout,
			recoilOffsetPx: shipState.recoilOffsetPx,
			thrusterFrame,
			thrusterActive: true,
		})
		context.restore()
	}, [
		active,
		planetNodes,
		resolvedLoadout,
		shipState,
		slingshotPull,
		thrusterFrame,
	])

	return (
		<div
			data-testid="space-arcade-canvas"
			data-arcade-active={String(active)}
			data-battery-tier={telemetry.tier}
			data-planet-count={planetNodes.length}
			data-ship-x={Math.round(shipState.x)}
			data-ship-y={Math.round(shipState.y)}
			data-ship-angle={Math.round(shipState.angleDegrees)}
			data-shots-fired={shipState.shotsFired}
			data-recoil-offset={Math.round(shipState.recoilOffsetPx)}
			className={`relative overflow-hidden rounded-xl border border-amber-500/30 bg-[#09090b]/95 ${className}`}
		>
			<canvas
				ref={canvasRef}
				width={920}
				height={540}
				onPointerDown={event => {
					const initialPull = {
						startX: event.clientX,
						startY: event.clientY,
						currentX: event.clientX,
						currentY: event.clientY,
					}
					slingshotPullRef.current = initialPull
					setSlingshotPull(initialPull)
				}}
				className="block h-full w-full cursor-grab touch-none active:cursor-grabbing"
			/>
			{active && (
				<div
					data-testid="arcade-hud"
					className="pointer-events-auto absolute inset-x-3 top-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-500/40 bg-neutral-950/90 px-3 py-2 text-xs text-amber-300 shadow-lg backdrop-blur"
				>
					<div className="flex flex-wrap items-center gap-3 font-mono">
						<span className="font-bold tracking-wider text-amber-400 uppercase">
							Arcade Flight Mode
						</span>
						<span className="text-neutral-300">
							Sector Bodies: <strong>{planetNodes.length}</strong>
						</span>
						<span className="text-neutral-300">
							Shots:{' '}
							<strong data-testid="arcade-shots-count">
								{shipState.shotsFired}
							</strong>
						</span>
						<span className="text-neutral-400">
							Drag to Slingshot • WASD / Space
						</span>
						{lastHitTodoTitle && (
							<span
								data-testid="arcade-last-target"
								className="rounded bg-amber-500/20 px-2 py-0.5 text-amber-200"
							>
								Targeted: {lastHitTodoTitle}
							</span>
						)}
					</div>
					<div className="flex items-center gap-1.5">
						<button
							type="button"
							data-testid="arcade-thrust-button"
							onClick={() => triggerThrustStep('thrust')}
							className="rounded border border-sky-500/40 bg-sky-500/15 px-2.5 py-1 font-mono text-xs text-sky-200 hover:bg-sky-500/25"
						>
							Thrust (W)
						</button>
						<button
							type="button"
							data-testid="arcade-fire-button"
							onClick={triggerFireHardpoints}
							className="rounded border border-amber-500/40 bg-amber-500/20 px-2.5 py-1 font-mono text-xs text-amber-200 hover:bg-amber-500/30"
						>
							Fire (Space)
						</button>
						{onExitArcade && (
							<button
								type="button"
								data-testid="arcade-exit-button"
								onClick={onExitArcade}
								className="rounded border border-rose-500/40 bg-rose-500/20 px-2.5 py-1 font-mono text-xs text-rose-200 hover:bg-rose-500/30"
							>
								Exit Arcade (Esc)
							</button>
						)}
					</div>
				</div>
			)}
		</div>
	)
}
