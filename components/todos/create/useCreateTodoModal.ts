import { useIonModal } from '@ionic/react'
import { HookOverlayOptions } from '@ionic/react/dist/types/hooks/HookOverlayOptions'
import { useCallback, useRef } from 'react'
import { db, ListType, Todo } from '../../db'
import useNoteProvider from '../../notes/useNoteProvider'
import { CreateTodoModal } from './modal'
import order from '../../common/order'

export function useCreateTodoModal(): [
	({
		onWillDismiss,
	}: {
		onWillDismiss: HookOverlayOptions['onWillDismiss']
	}) => void,
	(data?: any, role?: string) => void,
] {
	const titleInput = useRef<HTMLIonInputElement>(null)
	const [present, dismiss] = useIonModal(CreateTodoModal, {
		dismiss: (data: string, role: string) => dismiss(data, role),
		title: 'Create todo',
		titleInput,
	})

	const noteProvider = useNoteProvider()
	const createTodo = useCallback(
		async (todo: Todo, location: ListType) => {
			if (!todo.title) throw new TypeError('Title is required')

			let uri
			if (todo.note && noteProvider) {
				uri = await noteProvider.create({ content: todo.note })
			}
			await db.transaction('rw', db.todos, db.wayfinderOrder, async () => {
				const createdTodoId = await db.todos.add({
					createdAt: new Date(),
					starRole: todo.starRole,
					title: todo.title,
					...(uri && { note: { uri } }),
				})

				if (location === ListType.wayfinder) {
					const wayfinderOrder = await db.wayfinderOrder.orderBy('order').keys()
					console.debug({
						order: order(undefined, wayfinderOrder[0]?.toString()),
					})

					await db.wayfinderOrder.add({
						todoId: createdTodoId,
						order: order(undefined, wayfinderOrder[0]?.toString()),
					})
				}
			})
		},
		[noteProvider],
	)

	return [
		({ onWillDismiss }: HookOverlayOptions) => {
			present({
				onDidPresent: _event => {
					titleInput.current?.setFocus()
				},
				onWillDismiss: event => {
					if (event.detail.role === 'confirm') {
						const { todo, location } = event.detail.data
						createTodo(todo, location)
					}
					onWillDismiss?.(event)
				},
			})
		},
		dismiss,
	]
}
