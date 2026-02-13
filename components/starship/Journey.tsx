import { RefObject, useRef } from 'react'
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
		starship?.current,
		nextTodoPosition,
		commonAncestor.current,
	)

	return (
		<div className="min-w-[56px]">
			<Tracjectory
				className="absolute right-[27px]"
				currentPosition={starshipY}
			/>
			<div
				id="starship"
				className="absolute right-0 transition-transform duration-500 ease-in-out w-[56px] h-[56px]"
				style={{ transform: `translateY(${starshipY}px)` }}
			>
				<Starship
					className="rotate-180"
					ref={starship}
				/>
			</div>
		</div>
	)
}
