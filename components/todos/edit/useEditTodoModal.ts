import { useIonModal } from '@ionic/react'
import { useCallback, useRef } from 'react'
import { ListType, Todo, db } from '../../db'
import useNoteProvider from '../../notes/useNoteProvider'
import { EditTodoModal } from './modal'
import order from '../../common/order'
import { usePostHog } from 'posthog-js/react'

export function useEditTodoModal(): [
	(todo: Todo) => void,
	(data?: any, role?: string) => void,
] {
	const posthog = usePostHog()
	const titleInput = useRef<HTMLIonInputElement>(null)
	const todoRef = useRef<Todo>(undefined)
	const [present, dismiss] = useIonModal(EditTodoModal, {
		dismiss: (data: string, role: string) => dismiss(data, role),
		title: 'Edit todo',
		titleInput,
		// eslint-disable-next-line react-hooks/refs -- Value is set before present() is called
		todo: todoRef.current,
	})

	const noteProvider = useNoteProvider()
	const editTodo = useCallback(
		async (updatedTodo: any, location: ListType) => {
			if (!updatedTodo.title) throw new TypeError('Title is required')

			let uri
			if (updatedTodo.noteInitialContent && noteProvider) {
				uri = await noteProvider.create({ todo: updatedTodo })
			}
			await db.transaction(
				'rw',
				db.asteroidFieldOrder,
				db.wayfinderOrder,
				db.todos,
				async () => {
					await db.todos.update(updatedTodo.id, {
						createdAt: new Date(),
						starPoints: updatedTodo.starPoints,
						starRole: updatedTodo.starRole,
						title: updatedTodo.title,
						...(uri && { note: { uri } }),
					})
					if (location === ListType.asteroidField) {
						const asteroidFieldOrder = await db.asteroidFieldOrder
							.orderBy('order')
							.keys()
						await Promise.all([
							db.asteroidFieldOrder.put({
								todoId: updatedTodo.id,
								order: order(undefined, asteroidFieldOrder[0]?.toString()),
							}),
							db.wayfinderOrder.where({ todoId: updatedTodo.id }).delete(),
						])
					} else if (location === ListType.wayfinder) {
						const wayfinderOrder = await db.wayfinderOrder
							.orderBy('order')
							.keys()
						await Promise.all([
							db.wayfinderOrder.put({
								todoId: updatedTodo.id,
								order: order(undefined, wayfinderOrder[0]?.toString()),
							}),
							db.asteroidFieldOrder.where({ todoId: updatedTodo.id }).delete(),
						])
					}
				},
			)
		},
		[noteProvider],
	)

	return [
		(todo: Todo) => {
			todoRef.current = todo
			present({
				onDidPresent: _event => {
					titleInput.current?.setFocus()
				},
				onWillDismiss: event => {
					if (event.detail.role === 'confirm') {
						const { todo, location } = event.detail.data
						const originalTodo = todoRef.current
						editTodo(todo, location)
						posthog.capture('todo_edited', {
							location,
							changed_star_role: todo.starRole !== originalTodo!.starRole,
							changed_star_points: todo.starPoints !== originalTodo!.starPoints,
						})
					}
				},
			})
		},
		dismiss,
	]
}
