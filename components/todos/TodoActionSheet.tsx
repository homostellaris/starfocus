import { ActionSheetOptions, useIonActionSheet } from '@ionic/react'
import { HookOverlayOptions } from '@ionic/react/dist/types/hooks/HookOverlayOptions'
import { Todo, db } from '../db'
import { useEditTodoModal } from './edit/useEditTodoModal'

// TODO: Make this so that todo is never null, action sheet doesn't make sense to be open if its null
export function useTodoActionSheet() {
	// Using controller action sheet rather than inline because I was re-inventing what it was doing allowing dynamic options to be passed easily
	const [presentActionSheet, dismissActionSheet] = useIonActionSheet()
	// Using controller modal than inline because the trigger prop doesn't work with an ID on a controller-based action sheet button
	const [presentEditTodoModal] = useEditTodoModal()

	return [
		(todo: Todo, options?: ActionSheetOptions & HookOverlayOptions) => {
			presentActionSheet({
				buttons: [
					...(options?.buttons || []),
					{
						text: 'Edit',
						data: {
							action: 'edit',
						},
						handler: () => {
							presentEditTodoModal(todo)
						},
					},
					{
						text: 'Delete',
						role: 'destructive',
						data: {
							action: 'delete',
						},
						handler: async () => {
							db.transaction('rw', db.lists, db.todos, async () => {
								await db.todos.delete(todo.id)
								const important = await db.lists.get('#important')
								if (important!.order.includes(todo.id)) {
									await db.lists.update('#important', list => {
										list.order = list.order.filter(id => id !== todo.id)
									})
								}
							})
						},
					},
				],
				header: todo.title,
			})
		},
		dismissActionSheet,
	]
}
