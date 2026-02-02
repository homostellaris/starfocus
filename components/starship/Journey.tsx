import { RefObject, useRef } from 'react'
import Starship from '../common/Starship'
import { GameCanvas, useGameContext } from '../game'
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
	const { isGameMode, enterGameMode } = useGameContext()
	const starship = useRef<HTMLImageElement>(null)
	const [starshipY] = useStarshipYPosition(
		starship?.current,
		nextTodoPosition,
		commonAncestor.current,
	)

	return (
		<div className="min-w-[56px] h-full relative overflow-hidden">
			{/* Canvas-based starfield and spaceship */}
			<GameCanvas starshipY={starshipY} className="z-10" />

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
			{!isGameMode && (
				<button
					onClick={enterGameMode}
					className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity px-2 py-1 bg-violet-500/20 hover:bg-violet-500/40 text-violet-300 rounded text-xs font-mono border border-violet-500/30"
					title="Press G to play"
				>
					Play
				</button>
			)}
		</div>
	)
}
