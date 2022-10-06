import Todo from './Todo'
import { Todo as TodoInterface } from './interfaces'

export default function Todos(props: { todos: TodoInterface[] }) {
	return (
		<ol className="todos">
			{props.todos.reverse().map(todo => (
				<li key={todo.id}>
					<Todo todo={todo} />
				</li>
			))}
		</ol>
	)
}
