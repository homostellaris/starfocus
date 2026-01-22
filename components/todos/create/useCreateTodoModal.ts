import { useIonModal } from '@ionic/react'
import { HookOverlayOptions } from '@ionic/react/dist/types/hooks/HookOverlayOptions'
import { useCallback, useRef } from 'react'
import order from '../../common/order'
import { db, ListType, Todo, TodoInput } from '../../db'
import useNoteProvider from '../../notes/useNoteProvider'
import { CreateTodoModal } from './modal'
import { usePostHog } from 'posthog-js/react'
import StarPoints from '../../common/StarPoints'

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
	const titleInput = useRef<HTMLIonInputElement>(null)
	const todoRef = useRef<Todo>(undefined)
	const [present, dismiss] = useIonModal(CreateTodoModal, {
		dismiss: (data: string, role: string) => dismiss(data, role),
		title: 'Create todo',
		titleInput,
		todo: todoRef.current,
	})

	const noteProvider = useNoteProvider()
	const createTodo = useCallback(
		async (todo: TodoInput, location: ListType) => {
			if (!todo.title) throw new TypeError('Title is required')

			let uri
			await db.transaction(
				'rw',
				db.asteroidFieldOrder,
				db.wayfinderOrder,
				db.todos,
				async () => {
					if (todo.noteInitialContent && noteProvider) {
						uri = await noteProvider.create({
							todo,
						})
					}
					const createdTodoId = await db.todos.add({
						createdAt: new Date(),
						starPoints: todo.starPoints,
						starRole: todo.starRole,
						title: todo.title,
						...(uri && { note: { uri } }),
					})
					if (location === ListType.asteroidField) {
						const asteroidFieldOrder = await db.asteroidFieldOrder
							.orderBy('order')
							.keys()

						await db.asteroidFieldOrder.add({
							todoId: createdTodoId,
							order: order(undefined, asteroidFieldOrder[0]?.toString()),
						})
					} else if (location === ListType.wayfinder) {
						const wayfinderOrder = await db.wayfinderOrder
							.orderBy('order')
							.keys()

						await db.wayfinderOrder.add({
							todoId: createdTodoId,
							order: order(undefined, wayfinderOrder[0]?.toString()),
						})
					}
				},
			)
		},
		[noteProvider],
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
							has_note: !!todo.noteInitialContent,
						})
					}
					onWillDismiss?.(event)
				},
			})
		},
		dismiss,
	]
}
