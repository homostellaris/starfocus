import { RefObject, useEffect, useRef } from 'react'
import Starship from '../common/Starship'
import useTodoContext from '../todos/TodoContext'
import Tracjectory from './Trajectory'
import { useStarshipYPosition } from './useStarshipYPosition'

export const Journey = ({
	commonAncestor,
}: {
	commonAncestor: RefObject<HTMLElement | null>
}) => {
	const {
		nextTodo: {
			position: [nextTodoPosition],
		},
	} = useTodoContext()
	const starship = useRef<HTMLImageElement>(null)
	const [starshipY] = useStarshipYPosition(
		starship,
		nextTodoPosition,
		commonAncestor,
	)

	useEffect(() => {
		const rect = starship.current?.getBoundingClientRect()
		const viewportY = rect ? rect.top : 0
		window.dispatchEvent(new CustomEvent('game:shipY', { detail: viewportY }))
	}, [starshipY])

	return (
		<div className="min-w-[56px] h-full relative overflow-hidden">
			{/* Trajectory line overlay */}
			<Tracjectory
				className="absolute right-[27px] z-20"
				currentPosition={starshipY}
			/>

			{/* Hidden reference element for position calculation */}
			<div
				id="starship"
				className="absolute right-0 opacity-0 pointer-events-none w-[56px] h-[56px]"
				style={{ transform: `translateY(${starshipY}px)` }}
			>
				<Starship ref={starship} />
			</div>

			{/* Game mode trigger button - visible on hover */}
			<button
				onClick={() => window.dispatchEvent(new CustomEvent('game:enter'))}
				className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity px-2 py-1 bg-violet-500/20 hover:bg-violet-500/40 text-violet-300 rounded text-xs font-mono border border-violet-500/30"
				title="Press G to play"
			>
				Play
			</button>
		</div>
	)
}
