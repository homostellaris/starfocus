import { ActionSheetOptions, useIonActionSheet } from '@ionic/react'
import { HookOverlayOptions } from '@ionic/react/dist/types/hooks/HookOverlayOptions'
import { Todo, db } from '../db'
import { useEditTodoModal } from './edit/useEditTodoModal'
import { createSharp, openSharp, trashSharp } from 'ionicons/icons'
import { usePostHog } from 'posthog-js/react'

// TODO: Make this so that todo is never null, action sheet doesn't make sense to be open if its null
export function useTodoActionSheet() {
	const posthog = usePostHog()
	// Using controller action sheet rather than inline because I was re-inventing what it was doing allowing dynamic options to be passed easily
	const [presentActionSheet, dismissActionSheet] = useIonActionSheet()
	// Using controller modal rather than inline because the trigger prop doesn't work with an ID on a controller-based action sheet button
	const [presentEditTodoModal] = useEditTodoModal()

	return [
		(todo: Todo, options?: ActionSheetOptions & HookOverlayOptions) => {
			presentActionSheet({
				buttons: [
					...(todo.note?.uri
						? [
								{
									icon: openSharp,
									text: 'Open note',
									data: {
										action: 'open-note',
									},
									handler: async () => {
										open(todo.note?.uri)
										posthog.capture('todo_note_opened', {
											has_note: !!todo.note,
											note_provider: todo.note?.uri
												? new URL(todo.note.uri).protocol.replace(':', '')
												: undefined,
										})
									},
								},
							]
						: []),
					{
						icon: createSharp,
						text: 'Edit',
						data: {
							action: 'edit',
						},
						handler: () => {
							presentEditTodoModal(todo)
						},
					},
					{
						icon: trashSharp,
						text: 'Delete',
						role: 'destructive',
						data: {
							action: 'delete',
						},
						handler: async () => {
							db.transaction(
								'rw',
								db.visits,
								db.asteroidFieldOrder,
								db.wayfinderOrder,
								db.todos,
								async () => {
									await Promise.all([
										db.todos.delete(todo.id),
										db.asteroidFieldOrder.delete(todo.id),
										db.wayfinderOrder.delete(todo.id),
										db.visits.where('todoId').equals(todo.id).delete(),
									])
								},
							)
							posthog.capture('todo_deleted', {
								has_star_role: !!todo.starRole,
								star_points: todo.starPoints,
								has_note: !!todo.note,
							})
						},
					},
					...(options?.buttons || []),
				],
				header: todo.title,
				id: 'todo-action-sheet',
			})
		},
		dismissActionSheet,
	]
}
