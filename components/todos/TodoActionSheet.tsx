import React, {
	createContext,
	PropsWithChildren,
	useContext,
	useState,
} from 'react'
import { ActionSheetButton, IonActionSheet } from '@ionic/react'
import { CreatedTodo, db, Todo } from '../db'

export const TodoActionSheetContext = createContext<{
	open: (todo: CreatedTodo, actions?: (ActionSheetButton | string)[]) => void
	close: () => void
}>({
	open: () => null,
	close: () => null,
})

export function TodoActionSheetProvider({ children }: PropsWithChildren) {
	const [todo, setTodo] = useState<CreatedTodo | null>(null)
	const [actions, setActions] = useState<(ActionSheetButton | string)[]>([])

	return (
		<TodoActionSheetContext.Provider
			value={{
				open: (todo, actions) => {
					setTodo(todo)
					console.log({ actions })
					if (actions) setActions(actions)
				},
				close: () => {
					setTodo(null)
				},
			}}
		>
			{children}
			<IonActionSheet
				buttons={[
					...actions,
					{
						text: 'Delete',
						role: 'destructive',
						data: {
							action: 'delete',
						},
						handler: async () => {
							await db.todos.delete(todo?.id)
						},
					},
				]}
				header={todo?.title}
				isOpen={!!todo}
				onDidDismiss={() => {
					setTodo(null)
					setActions([])
				}}
			/>
		</TodoActionSheetContext.Provider>
	)
}

export function useTodoActionSheet() {
	const context = useContext(TodoActionSheetContext)
	return context
}
