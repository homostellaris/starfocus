import Todo from './Todo'
import { Todo as TodoInterface } from './interfaces'
import { useEffect, useLayoutEffect, useMemo } from 'react'

export default function Todos({ todos }: { todos: TodoInterface[] }) {
	useLayoutEffect(() => {
		setTimeout(() => {
			console.log(document.querySelector('.todos .todo:last-child'))
			document.querySelector('.todos li:last-child').scrollIntoView()
			window.scrollBy(0, -10)
		}, 2000)
	}, [])

	const sortedTodos = useMemo(
		() => todos.sort((a, b) => Number(b.id) - Number(a.id)),
		[todos]
	)

	return (
		// Without overflow-auto there is no margin between the bottom todo and the edge of the list 🤷‍♂️
		<ol className="pt-2 todos">
			{sortedTodos.map(todo => (
				<li key={todo.id}>
					<Todo todo={todo} />
				</li>
			))}
		</ol>
	)
}
