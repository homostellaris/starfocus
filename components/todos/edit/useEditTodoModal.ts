import { useIonModal } from '@ionic/react'
import { useCallback, useRef } from 'react'
import { ListType, Todo, db } from '../../db'
import { useMarkdownExportContext } from '../../export/MarkdownExportContext'
import { EditTodoModal } from './modal'
import todoRepository from '../repository'
import { usePostHog } from 'posthog-js/react'

export function useEditTodoModal(): [
	(todo: Todo) => void,
	(data?: any, role?: string) => void,
] {
	const posthog = usePostHog()
	const { requestPermissionIfNeeded } = useMarkdownExportContext()
	const titleInput = useRef<HTMLIonInputElement>(null)
	const todoRef = useRef<Todo>(undefined)
	const [present, dismiss] = useIonModal(EditTodoModal, {
		dismiss: (data: string, role: string) => dismiss(data, role),
		title: 'Edit todo',
		titleInput,
		// eslint-disable-next-line react-hooks/refs -- Value is set before present() is called
		todo: todoRef.current,
	})

	const editTodo = useCallback(async (updatedTodo: any, location: ListType) => {
		if (!updatedTodo.title) throw new TypeError('Title is required')

		await requestPermissionIfNeeded()
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
				})
				if (location === ListType.asteroidField) {
					await Promise.all([
						todoRepository.addToTopOfAsteroidField(updatedTodo.id),
						db.wayfinderOrder.where({ todoId: updatedTodo.id }).delete(),
					])
				} else if (location === ListType.wayfinder) {
					await Promise.all([
						todoRepository.addToTopOfWayfinder(updatedTodo.id),
						db.asteroidFieldOrder.where({ todoId: updatedTodo.id }).delete(),
					])
				} else if (location === ListType.database) {
					await Promise.all([
						db.asteroidFieldOrder.where({ todoId: updatedTodo.id }).delete(),
						db.wayfinderOrder.where({ todoId: updatedTodo.id }).delete(),
					])
				}
			},
		)
	}, [requestPermissionIfNeeded])

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
