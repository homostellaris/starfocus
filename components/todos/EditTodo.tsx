import { useIonModal } from '@ionic/react'
import { useCallback } from 'react'
import { CreatedTodo, db } from '../db'
import useNoteProvider from '../notes/useNoteProvider'
import useSelectedTodo from './SelectedTodo'
import TodoModal from './TodoModal'

export function EditTodoModal({
	dismiss,
	title,
	todo,
}: {
	dismiss: (data?: any, role?: string) => void
	title: string
	todo: CreatedTodo
}) {
	return (
		<TodoModal
			title={title}
			todo={todo}
			dismiss={dismiss}
		/>
	)
}

export function useEditTodoModal(): [
	(todo: CreatedTodo) => void,
	(data?: any, role?: string) => void,
] {
	const [todo, setTodo] = useSelectedTodo()
	const [present, dismiss] = useIonModal(EditTodoModal, {
		dismiss: (data: string, role: string) => dismiss(data, role),
		title: 'Edit todo',
		todo,
	})
	const noteProvider = useNoteProvider()
	const editTodo = useCallback(
		async (updatedTodo: CreatedTodo) => {
			let uri
			if (updatedTodo.note && noteProvider) {
				uri = await noteProvider.create({ content: updatedTodo.note })
			}
			await db.todos.update(updatedTodo.id, {
				createdAt: new Date(),
				title: updatedTodo.title,
				...(uri && { note: { uri } }),
			})
		},
		[noteProvider],
	)

	return [
		(todo: CreatedTodo) => {
			present({
				onWillPresent: () => {
					setTodo(todo)
				},
				onWillDismiss: event => {
					const todo = event.detail.data
					if (event.detail.role === 'confirm') editTodo(todo)
					setTodo(null)
				},
			})
		},
		dismiss,
	]
}
