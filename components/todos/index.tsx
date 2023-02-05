import Todo from './Todo'
import { Todo as TodoInterface } from './interfaces'
import { RefObject, useMemo } from 'react'

export default function Todos({
	currentTodoRef,
	todos,
}: {
	currentTodoRef?: RefObject<HTMLLIElement>
	todos: TodoInterface[]
}) {
	const sortedTodos = useMemo(
		() => todos.sort((a, b) => Number(b.id) - Number(a.id)),
		[todos]
	)

	return (
		// Without overflow-auto there is no margin between the bottom todo and the edge of the list 🤷‍♂️
		<ol className="pt-2 todos">
			{sortedTodos.map((todo, index) => (
				<li
					key={todo.id}
					ref={index + 1 === todos.length ? currentTodoRef : undefined}
				>
					<Todo todo={todo} />
				</li>
			))}
		</ol>
	)
}
