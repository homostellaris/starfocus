import Todo from './Todo'
import { Todo as TodoInterface } from './interfaces'
import { RefObject, useMemo } from 'react'

export default function Todos({
	currentTodoRef,
	todos,
}: {
	currentTodoRef?: RefObject<HTMLDivElement>
	todos: TodoInterface[]
}) {
	const sortedTodos = useMemo(
		() =>
			todos.sort((a, b) => {
				if (a.completedAt || b.completedAt) {
					return a.completedAt?.getTime() || 0 - b.completedAt?.getTime() || 0
				}
				return Number(b.rank) - Number(a.rank)
			}),
		[todos]
	)
	const completedCount = useMemo(
		() => todos.filter(todo => todo.completedAt).length,
		[todos]
	)

	return (
		// Without overflow-auto there is no margin between the bottom todo and the edge of the list 🤷‍♂️
		<div className="todos flex flex-wrap pt-2">
			{sortedTodos.map((todo, index) => (
				<Todo
					todo={todo}
					key={todo.id}
					reference={
						index + 1 === todos.length - completedCount
							? currentTodoRef
							: undefined
					}
					compact={index < sortedTodos.length - 7}
				/>
			))}
		</div>
	)
}
