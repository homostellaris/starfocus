import { createRef, useLayoutEffect, useState } from 'react'
import Starship from '../../landingPage/Journey/Starship'
import Todos from '../../todos'
import { Todo } from '../../todos/interfaces'

export default function Journey({ todos }: { todos: Todo[] }) {
	const currentTodoRef = createRef<HTMLDivElement>()

	useLayoutEffect(() => {
		currentTodoRef.current.scrollIntoView(true)
		// document
		// 	.getElementsByClassName('parallax-container')[0]
		// 	.scroll(0, currentTodoRef.current.offsetTop - window.innerHeight)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentTodoRef])

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
				todos={todos}
			/>
		</div>
	)
}
