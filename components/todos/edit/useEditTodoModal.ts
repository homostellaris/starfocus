import { useIonModal } from '@ionic/react'
import { ComponentProps, createElement, useCallback, useEffect, useRef } from 'react'
import { ListType, Todo, db } from '../../db'
import { markdownExportService } from '../../export/markdownExportService'
import { EditTodoModal } from './modal'
import todoRepository from '../repository'
import { usePostHog } from 'posthog-js/react'

export function useEditTodoModal(): [
	(todo: Todo) => void,
	(data?: any, role?: string) => void,
] {
	const posthog = usePostHog()
	const titleInput = useRef<HTMLIonInputElement>(null)
	const todoRef = useRef<Todo>(undefined)

	const EditTodoModalContainer = useCallback(
		(props: ComponentProps<typeof EditTodoModal>) =>
			createElement(EditTodoModal, {
				...props,
				todo: todoRef.current,
			}),
		[],
	)

	const [present, dismiss] = useIonModal(EditTodoModalContainer, {
		dismiss: (data: string, role: string) => dismiss(data, role),
		modalTitle: 'Edit todo',
		titleInput,
	})

	const editTodo = useCallback(async (updatedTodo: any, location: ListType) => {
		if (!updatedTodo.title) throw new TypeError('Title is required')

		await markdownExportService.requestPermissionIfNeeded()
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
				if (location === ListType.wayfinder) {
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
	}, [])

	const openEditModalRef = useRef<(todo: Todo) => void>(() => {})

	const openEditModal = useCallback(
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
				onDidDismiss: event => {
					if (
						event.detail.data?.action === 'open_existing' &&
						event.detail.data?.existingTodo
					) {
						openEditModalRef.current(event.detail.data.existingTodo)
					}
				},
			})
		},
		[editTodo, posthog, present],
	)

	useEffect(() => {
		openEditModalRef.current = openEditModal
	}, [openEditModal])

	return [openEditModal, dismiss]
}
