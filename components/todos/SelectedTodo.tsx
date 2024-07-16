import {
	createContext,
	Dispatch,
	SetStateAction,
	useContext,
	useState,
} from 'react'
import { CreatedTodo } from '../db'

export const SelecteTodoContext = createContext<
	[
		todo: CreatedTodo | null,
		setTodo: Dispatch<SetStateAction<CreatedTodo | null>>,
	]
>([null, () => null])

export function SelectedTodoProvider({
	children,
}: {
	children: React.ReactNode
}) {
	const [todo, setTodo] = useState<CreatedTodo | null>(null)

	return (
		<SelecteTodoContext.Provider value={[todo, setTodo]}>
			{children}
		</SelecteTodoContext.Provider>
	)
}

export default function useSelectedTodo() {
	return useContext(SelecteTodoContext)
}
