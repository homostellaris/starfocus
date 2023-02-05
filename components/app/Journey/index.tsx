import { createRef, RefObject, useLayoutEffect, useState } from 'react'
import Starship from '../../landingPage/Journey/Starship'
import Todos from '../../todos'
import Log from '../../todos/Log'
import todosFixture from '../../todos/todos.json'

export default function Journey({currentTodoRef}: {currentTodoRef: RefObject<HTMLLIElement>}) {
	const [starshipY, setStarshipY] = useState<number>(0)

	useLayoutEffect(() => {
		const elementPadding = 80
		const starshipImagePadding = 10
		setStarshipY(
			currentTodoRef.current.offsetTop - elementPadding - starshipImagePadding
		)
	}, [currentTodoRef])

	return (
		<div className="relative w-4/6 p-20 m-auto">
			<div
				id="starship"
				className={`absolute left-0 m-auto h-[10vmin] w-[10vmin] transition-transform`}
				style={{ transform: `translateY(${starshipY}px)` }}
			>
				<Starship />
			</div>
			<Todos
				currentTodoRef={currentTodoRef}
				todos={todosFixture}
			/>
			<Log
				todos={[
					{
						id: '1',
						completedAt: new Date('2020-01-01'),
						description: 'Complete Typescript course',
						role: 'Software Creator',
					},
					{
						id: '2',
						completedAt: new Date('2020-01-01'),
						description: 'Complete Typescript course',
						role: 'Software Creator',
					},
					{
						id: '3',
						completedAt: new Date('2020-01-01'),
						description: 'Complete Typescript course',
						role: 'Software Creator',
					},
				]}
			/>
		</div>
	)
}
