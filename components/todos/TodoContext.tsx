import {
	createContext,
	Dispatch,
	SetStateAction,
	useContext,
	useState,
} from 'react'
import { Todo } from '../db'

export const TodoContext = createContext<{
	nextTodo: {
		position: [
			get: DOMRect | null,
			set: Dispatch<SetStateAction<DOMRect | null>>,
		]
	}
	selectedTodo: [
		todo: Todo | null,
		setTodo: Dispatch<SetStateAction<Todo | null>>,
	]
}>({
	nextTodo: { position: [null, () => null] },
	selectedTodo: [null, () => null],
})

export function TodoContextProvider({
	children,
}: {
	children: React.ReactNode
}) {
	const [nextTodoPosition, setNextTodoPosition] = useState<DOMRect | null>(null)
	const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null)

	return (
		<TodoContext.Provider
			value={{
				nextTodo: {
					position: [nextTodoPosition, setNextTodoPosition],
				},
				selectedTodo: [selectedTodo, setSelectedTodo],
			}}
		>
			{children}
		</TodoContext.Provider>
	)
}

export default function useTodoContext() {
	return useContext(TodoContext)
}
