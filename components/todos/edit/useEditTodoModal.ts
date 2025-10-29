import { useIonModal } from '@ionic/react'
import { useCallback, useRef } from 'react'
import { Todo, db } from '../../db'
import useNoteProvider from '../../notes/useNoteProvider'
import useTodoContext from '../TodoContext'
import { EditTodoModal } from './modal'

export function useEditTodoModal(): [
	(todo: Todo) => void,
	(data?: any, role?: string) => void,
] {
	const {
		selectedTodo: [todo, setTodo],
	} = useTodoContext()
	const titleInput = useRef<HTMLIonInputElement>(null)
	const [present, dismiss] = useIonModal(EditTodoModal, {
		dismiss: (data: string, role: string) => dismiss(data, role),
		title: 'Edit todo',
		titleInput,
		todo,
	})
	const noteProvider = useNoteProvider()
	const editTodo = useCallback(
		async (updatedTodo: any) => {
			if (!updatedTodo.title) throw new TypeError('Title is required')

			let uri
			if (updatedTodo.noteInitialContent && noteProvider) {
				uri = await noteProvider.create({ todo: updatedTodo })
			}
			await db.todos.update(updatedTodo.id, {
				createdAt: new Date(),
				starPoints: updatedTodo.starPoints,
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
				onDidPresent: _event => {
					titleInput.current?.setFocus()
				},
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
