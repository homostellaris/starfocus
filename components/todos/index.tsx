import Todo from './Todo'
import { Todo as TodoInterface } from './interfaces'

export default function Todos(props: { todos: TodoInterface[] }) {
	return (
		// Without overflow-auto there is no margin between the bottom todo and the edge of the list 🤷‍♂️
		<ol className="todos overflow-auto">
			{props.todos.reverse().map(todo => (
				<li key={todo.id}>
					<Todo todo={todo} />
				</li>
			))}
		</ol>
	)
}
