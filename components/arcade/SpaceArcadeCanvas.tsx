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

	return <SpaceArcadeInteractiveCanvas {...props} />
}

function SpaceArcadeInteractiveCanvas({
	active,
	todos,
	starRoles = [],
	anchoredPositions = {},
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

	const projectilesRef = useRef<ArcadeProjectile[]>([])
	const particlePoolRef = useRef(createParticleRingPool())
	const controlsRef = useRef({
		thrustForward: false,
		turnLeft: false,
		turnRight: false,
	})
	const canvasRef = useRef<HTMLCanvasElement | null>(null)

	useEffect(() => {
		setPlanetNodes(initialNodes)
	}, [initialNodes])

	useEffect(() => {
		if (!active) return
		setShipState(previous => ({
			...previous,
			x: initialShipPosition?.x ?? previous.x,
			y: initialShipPosition?.y ?? previous.y,
			velocityX: initialVelocity?.vx ?? previous.velocityX,
			velocityY: initialVelocity?.vy ?? previous.velocityY,
			angleDegrees:
				initialShipPosition?.rotationDegrees ?? previous.angleDegrees,
		}))
	}, [active, initialShipPosition, initialVelocity])

	const triggerFireHardpoints = useCallback(() => {
		setShipState(previous => {
			const { projectiles, nextShipState } = spawnHardpointProjectiles(
				previous,
				resolvedLoadout.palette.emissiveCockpitBlue,
			)
			projectilesRef.current = [...projectilesRef.current, ...projectiles]
			return nextShipState
		})
	}, [resolvedLoadout.palette.emissiveCockpitBlue])

	const triggerThrustStep = useCallback(
		(direction: 'thrust' | 'left' | 'right') => {
			setShipState(previous =>
				stepShipPhysics(
					previous,
					{
						thrustForward: direction === 'thrust',
						turnLeft: direction === 'left',
						turnRight: direction === 'right',
					},
					0.06,
					{ width: 920, height: 540 },
				),
			)
		},
		[],
	)

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
			setShipState(currentShip => {
				const steppedShip = stepShipPhysics(
					currentShip,
					controlsRef.current,
					deltaSeconds,
					{ width: 920, height: 540 },
				)

				if (
					controlsRef.current.thrustForward &&
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
						color: resolvedLoadout.palette.emissiveCockpitBlue,
					})
				}

				const movedProjectiles = projectilesRef.current
					.map(bolt => ({
						...bolt,
						x: bolt.x + bolt.velocityX * deltaSeconds,
						y: bolt.y + bolt.velocityY * deltaSeconds,
						remainingLifeSeconds: bolt.remainingLifeSeconds - deltaSeconds,
					}))
					.filter(bolt => bolt.remainingLifeSeconds > 0)

				setPlanetNodes(currentPlanets => {
					const collisionOutcome = detectProjectileCollisions(
						movedProjectiles,
						currentPlanets,
					)
					projectilesRef.current = collisionOutcome.survivingProjectiles
					if (collisionOutcome.hitTodoIds.length > 0) {
						const hitNode = collisionOutcome.updatedPlanets.find(
							node => node.todoId === collisionOutcome.hitTodoIds[0],
						)
						if (hitNode) {
							setLastHitTodoTitle(hitNode.title)
							onSelectTodoPlanet?.(hitNode.todoId)
						}
					}
					return collisionOutcome.updatedPlanets
				})

				particlePoolRef.current.step(deltaSeconds)
				return steppedShip
			})
		}, intervalMs)

		return () => window.clearInterval(timerId)
	}, [
		active,
		onSelectTodoPlanet,
		resolvedLoadout.palette.emissiveCockpitBlue,
		telemetry.tier,
	])

	useEffect(() => {
		const canvasElement = canvasRef.current
		if (!canvasElement) return
		const context = canvasElement.getContext('2d')
		if (!context) return

		context.clearRect(0, 0, canvasElement.width, canvasElement.height)

		for (const node of planetNodes) {
			const baked = bakePlanetBitmap(node.spec, { enableDithering: true })
			const drawDiameter = node.radius * 2.2

			if (node.spec.celestialClass !== 'asteroid') {
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
			context.strokeStyle = active ? '#FFB703' : '#38bdf8'
			context.lineWidth = 1.6
			context.setLineDash([6, 4])
			context.beginPath()
			context.arc(node.x, node.y, node.radius + 8, 0, Math.PI * 2)
			context.stroke()
			context.restore()

			context.save()
			context.fillStyle = '#f8fafc'
			context.font = '600 11px ui-monospace, SFMono-Regular, monospace'
			context.textAlign = 'center'
			const truncatedTitle =
				node.title.length > 24 ? `${node.title.slice(0, 22)}…` : node.title
			context.fillText(
				`[${node.starPoints}pt] ${truncatedTitle}`,
				node.x,
				node.y + node.radius + 22,
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

		context.save()
		context.translate(shipState.x, shipState.y)
		context.rotate((shipState.angleDegrees * Math.PI) / 180)
		context.translate(-32, -32)
		paintModularShipToContext({
			context,
			loadout: resolvedLoadout,
			recoilOffsetPx: shipState.recoilOffsetPx,
			thrusterFrame,
			thrusterActive: true,
		})
		context.restore()
	}, [active, planetNodes, resolvedLoadout, shipState, thrusterFrame])

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
				onClick={triggerFireHardpoints}
				className="block h-full w-full cursor-crosshair"
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
							Sector Planets: <strong>{planetNodes.length}</strong>
						</span>
						<span className="text-neutral-300">
							Shots: <strong data-testid="arcade-shots-count">{shipState.shotsFired}</strong>
						</span>
						<span className="text-neutral-400">
							Tier: <strong>{telemetry.tier} ({telemetry.targetFps}fps)</strong>
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
