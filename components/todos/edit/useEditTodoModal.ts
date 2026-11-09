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
	const locationRef = useRef<ListType>(ListType.wayfinder)

	const EditTodoModalContainer = useCallback(
		(props: ComponentProps<typeof EditTodoModal>) =>
			createElement(EditTodoModal, {
				...props,
				initialLocation: locationRef.current,
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
		await markdownExportService.requestPermissionIfNeeded()
		await todoRepository.edit(updatedTodo, location)
	}, [])

	const openEditModalRef = useRef<(todo: Todo) => void>(() => {})

	const openEditModal = useCallback(
		async (todo: Todo) => {
			todoRef.current = todo
			const isWayfinder =
				(todo as any).order !== undefined ||
				(await db.wayfinderOrder.get(todo.id)) !== undefined
			locationRef.current = isWayfinder ? ListType.wayfinder : ListType.database
			let existingTodoToOpen: Todo | undefined

			present({
				onDidPresent: _event => {
					titleInput.current?.setFocus()
				},
				onWillDismiss: event => {
					if (
						event.detail.data?.action === 'open_existing' &&
						event.detail.data?.existingTodo
					) {
						existingTodoToOpen = event.detail.data.existingTodo
					} else if (event.detail.role === 'confirm') {
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
					const existingTodo =
						existingTodoToOpen ??
						(event.detail.data?.action === 'open_existing'
							? event.detail.data.existingTodo
							: undefined)

					if (existingTodo) {
						setTimeout(() => {
							openEditModalRef.current(existingTodo)
						}, 100)
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
