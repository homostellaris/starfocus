import { useIonModal } from '@ionic/react'
import { HookOverlayOptions } from '@ionic/react/dist/types/hooks/HookOverlayOptions'
import { useCallback, useRef } from 'react'
import { db, ListType, Todo, TodoInput } from '../../db'
import { useMarkdownExportContext } from '../../export/MarkdownExportContext'
import todoRepository from '../repository'
import { CreateTodoModal } from './modal'
import { usePostHog } from 'posthog-js/react'

export function useCreateTodoModal(): [
	({
		onWillDismiss,
		todo,
	}: {
		onWillDismiss: HookOverlayOptions['onWillDismiss']
		todo: any
	}) => void,
	(data?: any, role?: string) => void,
] {
	const posthog = usePostHog()
	const { requestPermissionIfNeeded } = useMarkdownExportContext()
	const titleInput = useRef<HTMLIonInputElement>(null)
	const todoRef = useRef<Todo>(undefined)
	const [present, dismiss] = useIonModal(CreateTodoModal, {
		dismiss: (data: string, role: string) => dismiss(data, role),
		title: 'Create todo',
		titleInput,
		// eslint-disable-next-line react-hooks/refs -- Value is set before present() is called
		todo: todoRef.current,
	})

	const createTodo = useCallback(
		async (todo: TodoInput, location: ListType) => {
			if (!todo.title) throw new TypeError('Title is required')

			await requestPermissionIfNeeded()
			await db.transaction(
				'rw',
				db.asteroidFieldOrder,
				db.wayfinderOrder,
				db.todos,
				async () => {
					const createdTodoId = await db.todos.add({
						createdAt: new Date(),
						starPoints: todo.starPoints,
						starRole: todo.starRole,
						title: todo.title,
					})
					if (location === ListType.asteroidField) {
						await todoRepository.addToTopOfAsteroidField(createdTodoId.toString())
					} else if (location === ListType.wayfinder) {
						await todoRepository.addToTopOfWayfinder(createdTodoId.toString())
					}
				},
			)
		},
		[requestPermissionIfNeeded],
	)

	return [
		({ onWillDismiss, todo }: HookOverlayOptions & { todo: Todo }) => {
			todoRef.current = todo
			present({
				onDidPresent: _event => {
					titleInput.current?.setFocus()
				},
				onWillDismiss: async event => {
					if (event.detail.role === 'confirm') {
						const { todo, location } = event.detail.data
						await createTodo(todo, location)
						posthog.capture('todo_created', {
							location,
							has_star_role: !!todo.starRole,
							star_points: todo.starPoints,
						})
					}
					onWillDismiss?.(event)
				},
			})
		},
		dismiss,
	]
}
