import React, { RefObject, useEffect, useRef, useState } from 'react'
import PlanetAsset from '../assets/PlanetAsset'
import { calculateSlingshotImpulse } from '../arcade/arcadePhysics'
import Starship from '../common/Starship'
import type { Todo } from '../db'
import { useStarPointsTheme } from '../theme/starPointsThemes'
import useTodoContext from '../todos/TodoContext'
import { computeOrbitalState } from './orbitalMechanics'
import { StarshipCustomizerPopover } from './StarshipCustomizerPopover'
import Tracjectory from './Trajectory'
import { useStarshipCustomization } from './useStarshipCustomization'
import { useStarshipYPosition } from './useStarshipYPosition'

export const Journey = ({
	commonAncestor,
	onLaunchArcade,
	todos = [],
	activeTodoId,
}: {
	commonAncestor: RefObject<HTMLElement | null>
	onLaunchArcade?: (initialVelocity?: { vx: number; vy: number }) => void
	todos?: Array<Pick<Todo, 'id' | 'title' | 'starPoints' | 'starRole'>>
	activeTodoId?: string
}) => {
	const { themeId } = useStarPointsTheme()
	const { stagingMode } = useStarshipCustomization()
	const journeyContainer = useRef<HTMLDivElement>(null)
	const [todoPositions, setTodoPositions] = useState<Record<string, number>>({})
	const [elapsedSeconds, setElapsedSeconds] = useState(0)
	const [isLandscape, setIsLandscape] = useState(false)
	const didLaunchSlingshotRef = useRef(false)

	useEffect(() => {
		if (typeof window === 'undefined') return

		const updateOrientation = () => {
			setIsLandscape(window.innerWidth >= 840)
		}
		updateOrientation()
		window.addEventListener('resize', updateOrientation)

		let animationFrameIdentifier: number
		const startTime = performance.now()

		const tick = (currentTime: number) => {
			if (!document.hidden) {
				setElapsedSeconds((currentTime - startTime) / 1000)
			}
			animationFrameIdentifier = requestAnimationFrame(tick)
		}
		animationFrameIdentifier = requestAnimationFrame(tick)

		return () => {
			cancelAnimationFrame(animationFrameIdentifier)
			window.removeEventListener('resize', updateOrientation)
		}
	}, [])

	const {
		nextTodo: {
			position: [nextTodoPosition],
		},
	} = useTodoContext()
	const starship = useRef<HTMLDivElement>(null)
	const [fallbackStarshipY] = useStarshipYPosition(
		starship,
		nextTodoPosition,
		commonAncestor,
	)

	useEffect(() => {
		if (typeof window === 'undefined') return

		const updatePositions = () => {
			if (!journeyContainer.current) return
			const containerRect = journeyContainer.current.getBoundingClientRect()
			const calculatedPositions: Record<string, number> = {}

			todos.forEach(todo => {
				const itemElement = document.getElementById(`todo-${todo.id}`)
				if (itemElement) {
					const itemRect = itemElement.getBoundingClientRect()
					const itemCenterY =
						itemRect.top - containerRect.top + itemRect.height / 2
					calculatedPositions[todo.id] = itemCenterY - 28
				}
			})

			setTodoPositions(calculatedPositions)
		}

		updatePositions()
		const animationFrameIdentifier = requestAnimationFrame(updatePositions)
		const timerIdentifier = setTimeout(updatePositions, 150)
		window.addEventListener('resize', updatePositions)

		return () => {
			cancelAnimationFrame(animationFrameIdentifier)
			clearTimeout(timerIdentifier)
			window.removeEventListener('resize', updatePositions)
		}
	}, [todos])

	const starshipY =
		activeTodoId && todoPositions[activeTodoId] !== undefined
			? todoPositions[activeTodoId]
			: fallbackStarshipY

	const [slingshotDrag, setSlingshotDrag] = useState<{
		startX: number
		startY: number
		currentX: number
		currentY: number
	} | null>(null)
	const slingshotDragRef = useRef<{
		startX: number
		startY: number
		currentX: number
		currentY: number
	} | null>(null)

	useEffect(() => {
		if (typeof window === 'undefined') return

		const handleWindowPointerMove = (event: PointerEvent) => {
			if (!slingshotDragRef.current) return
			const nextDrag = {
				...slingshotDragRef.current,
				currentX: event.clientX,
				currentY: event.clientY,
			}
			slingshotDragRef.current = nextDrag
			setSlingshotDrag(nextDrag)
		}

		const handleWindowPointerUp = (event: PointerEvent) => {
			const activeDrag = slingshotDragRef.current
			if (!activeDrag) return
			slingshotDragRef.current = null
			setSlingshotDrag(null)

			const distance = Math.hypot(
				event.clientX - activeDrag.startX,
				event.clientY - activeDrag.startY,
			)

			if (distance >= 18) {
				const impulse = calculateSlingshotImpulse(
					{ startX: activeDrag.startX, startY: activeDrag.startY },
					{ currentX: event.clientX, currentY: event.clientY },
				)
				if (impulse) {
					didLaunchSlingshotRef.current = true
					onLaunchArcade?.({ vx: impulse.vx, vy: impulse.vy })
				}
			} else if (distance < 12) {
				const popover = document.getElementById(
					'starship-customizer-popover',
				) as any
				popover?.present()
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
	}, [onLaunchArcade])

	const dragDeltaX = slingshotDrag
		? Math.max(
				-42,
				Math.min(42, (slingshotDrag.currentX - slingshotDrag.startX) * 0.35),
			)
		: 0
	const dragDeltaY = slingshotDrag
		? Math.max(
				-42,
				Math.min(42, (slingshotDrag.currentY - slingshotDrag.startY) * 0.35),
			)
		: 0
	const activeImpulse = slingshotDrag
		? calculateSlingshotImpulse(
				{ startX: slingshotDrag.startX, startY: slingshotDrag.startY },
				{ currentX: slingshotDrag.currentX, currentY: slingshotDrag.currentY },
			)
		: null

	const isOrbitingActiveTodo =
		Boolean(activeTodoId) && todoPositions[activeTodoId as string] !== undefined

	const orbitalState = computeOrbitalState({
		mode: isOrbitingActiveTodo ? stagingMode : 'kepler_orbit',
		elapsedSeconds,
		isLandscape,
		isDragging: Boolean(slingshotDrag) || !isOrbitingActiveTodo,
	})

	const maxTodoPosition = Object.values(todoPositions).reduce(
		(maximum, position) => Math.max(maximum, position),
		0,
	)

	return (
		<div
			ref={journeyContainer}
			className="relative h-full min-h-full min-w-[56px]"
			style={{
				minHeight: maxTodoPosition > 0 ? `${maxTodoPosition + 140}px` : '100%',
			}}
		>
			<Tracjectory
				className="absolute top-0 bottom-0 right-[27px] z-0 min-h-full"
				currentPosition={starshipY}
			/>
			{todos.map(todo => {
				const position = todoPositions[todo.id]
				if (position === undefined) return null
				const isActiveTodo = todo.id === activeTodoId

				return (
					<div
						key={todo.id}
						data-testid={`gutter-celestial-body-${todo.id}`}
						data-todo-id={todo.id}
						className="pointer-events-none absolute right-0 z-[2] flex h-[56px] w-[56px] items-center justify-center transition-transform duration-500 ease-in-out"
						style={{
							transform: `translateY(${position}px)`,
						}}
					>
						<PlanetAsset
							size={36}
							themeId={themeId}
							todo={{
								id: todo.id,
								title: todo.title,
								starPoints: todo.starPoints,
								starRole: todo.starRole,
							}}
						/>

						{isActiveTodo && orbitalState.showOrbitGuide && !slingshotDrag && (
							<svg
								viewBox="-28 -28 56 56"
								className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
								aria-hidden="true"
							>
								<ellipse
									cx="0"
									cy="0"
									rx={stagingMode === 'dual_staging' && isLandscape ? 48 : 23.5}
									ry={stagingMode === 'dual_staging' && isLandscape ? 16 : 9.5}
									transform="rotate(-14)"
									fill="none"
									stroke="#38bdf8"
									strokeWidth="1"
									strokeDasharray="2 3"
									opacity="0.3"
								/>
							</svg>
						)}

						{isActiveTodo && orbitalState.scannerBeamTarget && !slingshotDrag && (
							<svg
								viewBox="-28 -28 56 56"
								className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
								aria-hidden="true"
							>
								<line
									x1={orbitalState.offsetX}
									y1={orbitalState.offsetY}
									x2="0"
									y2="0"
									stroke="#38bdf8"
									strokeWidth="1.5"
									strokeDasharray="3 2"
									opacity="0.75"
								/>
							</svg>
						)}
					</div>
				)
			})}
			<div
				id="starship"
				data-testid="home-starship"
				data-slingshot-ready={String(Boolean(activeImpulse))}
				data-orbit-behind={String(orbitalState.isBehind)}
				data-flight-staging={stagingMode}
				title="Tap to customize ship & theme. Pull back & release to slingshot into Arcade Mode (or press G)"
				onClick={() => {
					if (didLaunchSlingshotRef.current) {
						didLaunchSlingshotRef.current = false
						return
					}
					const popover = document.getElementById(
						'starship-customizer-popover',
					) as any
					popover?.present()
				}}
				onDoubleClick={() => onLaunchArcade?.()}
				onDragStart={event => event.preventDefault()}
				onPointerDown={event => {
					event.preventDefault()
					const initialDrag = {
						startX: event.clientX,
						startY: event.clientY,
						currentX: event.clientX,
						currentY: event.clientY,
					}
					slingshotDragRef.current = initialDrag
					setSlingshotDrag(initialDrag)
				}}
				className={`absolute right-0 h-[56px] w-[56px] cursor-pointer touch-none select-none active:cursor-grabbing ${
					slingshotDrag ? '' : 'transition-transform duration-75 ease-out'
				} ${orbitalState.isBehind ? 'z-0' : 'z-10'}`}
				style={{
					transform: `translate(${dragDeltaX + orbitalState.offsetX}px, ${starshipY + dragDeltaY + orbitalState.offsetY}px)`,
					opacity: orbitalState.opacity,
				}}
			>
				{slingshotDrag && (
					<svg
						viewBox="-60 -60 120 120"
						className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
						aria-hidden="true"
					>
						<line
							x1={-dragDeltaX}
							y1={-dragDeltaY}
							x2="0"
							y2="0"
							stroke="#fbbf24"
							strokeWidth="2.5"
							strokeDasharray="4 3"
						/>
						{activeImpulse && (
							<line
								x1="0"
								y1="0"
								x2={-dragDeltaX * 2.2}
								y2={-dragDeltaY * 2.2}
								stroke="#38bdf8"
								strokeWidth="2.5"
							/>
						)}
					</svg>
				)}
				<div
					className="h-full w-full flex items-center justify-center pointer-events-none"
					style={{
						transform: `scale(${orbitalState.scale})`,
						transition: 'transform 100ms ease-out',
					}}
				>
					<Starship
						rotationDegrees={
							activeImpulse
								? activeImpulse.angleDegrees
								: orbitalState.headingDegrees
						}
						ref={starship}
					/>
				</div>
			</div>

			<StarshipCustomizerPopover trigger="starship" />
		</div>
	)
}
