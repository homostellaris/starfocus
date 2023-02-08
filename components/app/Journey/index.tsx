import { RefObject, useLayoutEffect, useState } from 'react'
import Starship from '../../landingPage/Journey/Starship'
import Todos from '../../todos'
import todosFixture from '../../todos/todos.json'

export default function Journey({
	currentTodoRef,
}: {
	currentTodoRef: RefObject<HTMLDivElement>
}) {
	const [starshipY, setStarshipY] = useState<number>(0)

	useLayoutEffect(() => {
		const elementPadding = 80
		const starshipImagePadding = 10
		setStarshipY(
			currentTodoRef.current.offsetTop - elementPadding - starshipImagePadding
		)
	}, [currentTodoRef])

	return (
		<div className="relative m-auto w-4/6 p-20">
			<div
				id="starship"
				className={`absolute left-0 m-auto h-[10vmin] w-[10vmin] transition-transform`}
				style={{ transform: `translateY(${starshipY}px)` }}
			>
				<Starship />
			</div>
			<Todos
				currentTodoRef={currentTodoRef}
				todos={todosFixture.map(todoFixture => ({
					...todoFixture,
					completedAt: todoFixture.completedAt
						? new Date(todoFixture.completedAt)
						: undefined,
				}))}
			/>
		</div>
	)
}
