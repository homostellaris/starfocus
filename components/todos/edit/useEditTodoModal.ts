import { useIonModal } from '@ionic/react'
import { useCallback } from 'react'
import { Todo, db } from '../../db'
import useNoteProvider from '../../notes/useNoteProvider'
import useSelectedTodo from '../SelectedTodo'
import { EditTodoModal } from './modal'

export function useEditTodoModal(): [
	(todo: Todo) => void,
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
		async (updatedTodo: Todo) => {
			if (!updatedTodo.title) throw new TypeError('Title is required')

			let uri
			if (updatedTodo.note && noteProvider) {
				uri = await noteProvider.create({ content: updatedTodo.note })
			}
			await db.todos.update(updatedTodo.id, {
				createdAt: new Date(),
				starRole: updatedTodo.starRole,
				title: updatedTodo.title,
				...(uri && { note: { uri } }),
			})
		},
		[noteProvider],
	)

	return [
		(todo: Todo) => {
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
