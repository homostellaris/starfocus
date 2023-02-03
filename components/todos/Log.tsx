import Todo from './Todo'
import { Todo as TodoInterface } from './interfaces'

export default function Log(props: { todos: TodoInterface[] }) {
	return (
		// Without overflow-auto there is no margin between the bottom todo and the edge of the list 🤷‍♂️
		<ol className="pb-2 log">
			{props.todos.reverse().map(todo => (
				<li key={todo.id}>
					<Todo todo={todo} />
				</li>
			))}
		</ol>
	)
}
