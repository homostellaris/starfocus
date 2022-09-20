import Todo from './Todo'
import { Todo as TodoInterface } from './interfaces'

type TodosPropType = {
	todos: TodoInterface[]
}

export default function Todos(props: TodosPropType) {
	return (
		<ol className="todos">
			{props.todos.map(todo => (
				<li key={todo.id}>
					<Todo todo={todo} />
				</li>
			))}
		</ol>
	)
}
