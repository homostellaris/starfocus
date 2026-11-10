import React, { RefObject, useEffect, useRef, useState } from 'react'
import PlanetAsset from '../assets/PlanetAsset'
import { calculateSlingshotImpulse } from '../arcade/arcadePhysics'
import Starship from '../common/Starship'
import type { Todo } from '../db'
import { useStarPointsTheme } from '../theme/starPointsThemes'
import useTodoContext from '../todos/TodoContext'
import Tracjectory from './Trajectory'
import { useStarshipYPosition } from './useStarshipYPosition'
import { StarshipCustomizerPopover } from './StarshipCustomizerPopover'

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
	const journeyContainer = useRef<HTMLDivElement>(null)
	const [todoPositions, setTodoPositions] = useState<Record<string, number>>({})
	const didLaunchSlingshotRef = useRef(false)

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

	return (
		<div ref={journeyContainer} className="relative h-full min-w-[56px]">
			<Tracjectory
				className="absolute right-[27px] z-0"
				currentPosition={starshipY}
			/>
			{todos.map(todo => {
				const position = todoPositions[todo.id]
				if (position === undefined) return null
				return (
					<div
						key={todo.id}
						data-testid={`gutter-celestial-body-${todo.id}`}
						data-todo-id={todo.id}
						className="pointer-events-none absolute right-0 z-0 flex h-[56px] w-[56px] items-center justify-center transition-transform duration-500 ease-in-out"
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
					</div>
				)
			})}
			<div
				id="starship"
				data-testid="home-starship"
				data-slingshot-ready={String(Boolean(activeImpulse))}
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
				className={`absolute right-0 z-10 h-[56px] w-[56px] cursor-pointer touch-none select-none active:cursor-grabbing ${
					slingshotDrag ? '' : 'transition-transform duration-500 ease-in-out'
				}`}
				style={{
					transform: `translate(${dragDeltaX}px, ${starshipY + dragDeltaY}px)`,
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
				<Starship
					className={activeImpulse ? '' : 'rotate-180'}
					rotationDegrees={activeImpulse ? activeImpulse.angleDegrees : undefined}
					ref={starship}
				/>
			</div>

			<StarshipCustomizerPopover trigger="starship" />
		</div>
	)
}
