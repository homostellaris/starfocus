import React, { RefObject, useRef, useState } from 'react'
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

	const [slingshotOrigin, setSlingshotOrigin] = useState<{
		startX: number
		startY: number
	} | null>(null)

	return (
		<div className="min-w-[56px]">
			<Tracjectory
				className="absolute right-[27px]"
				currentPosition={starshipY}
			/>
			<div
				id="starship"
				data-testid="home-starship"
				title="Double-click or pull back to launch Arcade Mode (Shortcut: G)"
				onDoubleClick={() => onLaunchArcade?.()}
				onPointerDown={event => {
					setSlingshotOrigin({
						startX: event.clientX,
						startY: event.clientY,
					})
				}}
				onPointerUp={event => {
					if (!slingshotOrigin) return
					const impulse = calculateSlingshotImpulse(slingshotOrigin, {
						currentX: event.clientX,
						currentY: event.clientY,
					})
					setSlingshotOrigin(null)
					if (impulse) {
						onLaunchArcade?.({ vx: impulse.vx, vy: impulse.vy })
					}
				}}
				className="absolute right-0 h-[56px] w-[56px] cursor-pointer transition-transform duration-500 ease-in-out"
				style={{ transform: `translateY(${starshipY}px)` }}
			>
				<Starship
					className="rotate-180"
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
