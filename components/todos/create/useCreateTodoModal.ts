import { useIonModal } from '@ionic/react'
import { HookOverlayOptions } from '@ionic/react/dist/types/hooks/HookOverlayOptions'
import { useCallback } from 'react'
import { db, ListType, Todo } from '../../db'
import useNoteProvider from '../../notes/useNoteProvider'
import { CreateTodoModal } from './modal'

export function useCreateTodoModal(): [
	({
		onWillDismiss,
	}: {
		onWillDismiss: HookOverlayOptions['onWillDismiss']
	}) => void,
	(data?: any, role?: string) => void,
] {
	const [present, dismiss] = useIonModal(CreateTodoModal, {
		dismiss: (data: string, role: string) => dismiss(data, role),
		title: 'Create todo',
	})

	const noteProvider = useNoteProvider()
	const createTodo = useCallback(
		async (todo: Todo, location: ListType) => {
			if (!todo.title) throw new TypeError('Title is required')

			let uri
			if (todo.note && noteProvider) {
				uri = await noteProvider.create({ content: todo.note })
			}
			db.transaction('rw', db.todos, db.lists, async () => {
				const createdTodo = await db.todos.add({
					createdAt: new Date(),
					starRole: todo.starRole,
					title: todo.title,
					...(uri && { note: { uri } }),
				})
				if (location === ListType.important) {
					const list = await db.lists.get('#important')
					await db.lists.update('#important', {
						order: [createdTodo, ...list!.order],
					})
				}
			})
		},
		[noteProvider],
	)

	return [
		({ onWillDismiss }: HookOverlayOptions) => {
			present({
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
