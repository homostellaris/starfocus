import { ActionSheetOptions, useIonActionSheet } from '@ionic/react'
import { HookOverlayOptions } from '@ionic/react/dist/types/hooks/HookOverlayOptions'
import { Todo, db } from '../db'
import { useEditTodoModal } from './edit/useEditTodoModal'

// TODO: Make this so that todo is never null, action sheet doesn't make sense to be open if its null
export function useTodoActionSheet() {
	// Using controller action sheet rather than inline because I was re-inventing what it was doing allowing dynamic options to be passed easily
	const [presentActionSheet, dismissActionSheet] = useIonActionSheet()
	// Using controller modal rather than inline because the trigger prop doesn't work with an ID on a controller-based action sheet button
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
							db.transaction('rw', db.wayfinderOrder, db.todos, async () => {
								await Promise.all([
									db.todos.delete(todo.id),
									db.wayfinderOrder.delete(todo.id),
								])
							})
						},
					},
					...(todo.note?.uri
						? [
								{
									text: 'Open note',
									data: {
										action: 'open-note',
									},
									handler: async () => {
										open(todo.note?.uri)
									},
								},
							]
						: []),
				],
				header: todo.title,
				id: 'todo-action-sheet',
			})
		},
		dismissActionSheet,
	]
}
