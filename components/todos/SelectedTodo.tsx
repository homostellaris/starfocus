import {
	createContext,
	Dispatch,
	SetStateAction,
	useContext,
	useState,
} from 'react'
import { Todo } from '../db'

export const SelecteTodoContext = createContext<
	[todo: Todo | null, setTodo: Dispatch<SetStateAction<Todo | null>>]
>([null, () => null])

export function SelectedTodoProvider({
	children,
}: {
	children: React.ReactNode
}) {
	const [todo, setTodo] = useState<Todo | null>(null)

	return (
		<SelecteTodoContext.Provider value={[todo, setTodo]}>
			{children}
		</SelecteTodoContext.Provider>
	)
}

export default function useSelectedTodo() {
	return useContext(SelecteTodoContext)
}
