import React, { RefObject, useEffect, useRef, useState } from 'react'
import { calculateSlingshotImpulse } from '../arcade/arcadePhysics'
import Starship from '../common/Starship'
import useTodoContext from '../todos/TodoContext'
import Tracjectory from './Trajectory'
import { useStarshipYPosition } from './useStarshipYPosition'

export const Journey = ({
	commonAncestor,
	onLaunchArcade,
}: {
	commonAncestor: RefObject<HTMLElement | null>
	onLaunchArcade?: (initialVelocity?: { vx: number; vy: number }) => void
}) => {
	const {
		nextTodo: {
			position: [nextTodoPosition],
		},
	} = useTodoContext()
	const starship = useRef<HTMLDivElement>(null)
	const [starshipY] = useStarshipYPosition(
		starship,
		nextTodoPosition,
		commonAncestor,
	)

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

			const impulse = calculateSlingshotImpulse(
				{ startX: activeDrag.startX, startY: activeDrag.startY },
				{ currentX: event.clientX, currentY: event.clientY },
			)
			if (impulse) {
				onLaunchArcade?.({ vx: impulse.vx, vy: impulse.vy })
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
		? Math.max(-42, Math.min(42, (slingshotDrag.currentX - slingshotDrag.startX) * 0.35))
		: 0
	const dragDeltaY = slingshotDrag
		? Math.max(-42, Math.min(42, (slingshotDrag.currentY - slingshotDrag.startY) * 0.35))
		: 0
	const activeImpulse = slingshotDrag
		? calculateSlingshotImpulse(
				{ startX: slingshotDrag.startX, startY: slingshotDrag.startY },
				{ currentX: slingshotDrag.currentX, currentY: slingshotDrag.currentY },
			)
		: null

	return (
		<div className="min-w-[56px]">
			<Tracjectory
				className="absolute right-[27px]"
				currentPosition={starshipY}
			/>
			<div
				id="starship"
				data-testid="home-starship"
				data-slingshot-ready={String(Boolean(activeImpulse))}
				title="Pull back & release to slingshot into Arcade Mode (or double-click / press G)"
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
				className={`absolute right-0 h-[56px] w-[56px] cursor-grab touch-none select-none active:cursor-grabbing ${
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
			{onLaunchArcade && (
				<button
					type="button"
					data-testid="arcade-launch-button"
					onClick={() => onLaunchArcade()}
					style={{ transform: `translateY(${starshipY + 60}px)` }}
					className="absolute right-0.5 z-10 rounded border border-sky-500/30 bg-neutral-950/90 px-1.5 py-0.5 font-mono text-[10px] text-sky-300 transition hover:border-amber-400/60 hover:text-amber-300"
					title="Launch Seamless Arcade Mode (G)"
				>
					Play
				</button>
			)}
		</div>
	)
}
