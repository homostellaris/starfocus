import {
	ActionSheetOptions,
	useIonActionSheet,
	useIonToast,
} from '@ionic/react'
import { HookOverlayOptions } from '@ionic/react/dist/types/hooks/HookOverlayOptions'
import { Todo, db } from '../db'
import { markdownExportService } from '../export/markdownExportService'
import { useEditTodoModal } from './edit/useEditTodoModal'
import {
	clipboardSharp,
	createSharp,
	openSharp,
	trashSharp,
} from 'ionicons/icons'
import { usePostHog } from 'posthog-js/react'
import { generateFilename } from '../export/markdown'
import { useObsidian } from '../obsidian/useObsidian'

// TODO: Make this so that todo is never null, action sheet doesn't make sense to be open if its null
export function useTodoActionSheet() {
	const posthog = usePostHog()
	const { isConfigured: isObsidianConfigured, openNote: openObsidianNote } =
		useObsidian()
	// Using controller action sheet rather than inline because I was re-inventing what it was doing allowing dynamic options to be passed easily
	const [presentActionSheet, dismissActionSheet] = useIonActionSheet()
	const [presentToast] = useIonToast()
	// Using controller modal rather than inline because the trigger prop doesn't work with an ID on a controller-based action sheet button
	const [presentEditTodoModal] = useEditTodoModal()

	return [
		(todo: Todo, options?: ActionSheetOptions & HookOverlayOptions) => {
			presentActionSheet({
				buttons: [
					...(isObsidianConfigured
						? [
								{
									icon: openSharp,
									text: 'Open note in Obsidian',
									data: {
										action: 'open-note',
									},
									handler: () => {
										openObsidianNote(todo)
									},
								},
							]
						: []),
					{
						icon: clipboardSharp,
						text: 'Copy filename',
						data: {
							action: 'copy-filename',
						},
						handler: async () => {
							const filename = generateFilename(todo).replace(/\.md$/, '')
							await navigator.clipboard.writeText(filename)
							presentToast({
								message: `Copied "${filename}" to clipboard`,
								duration: 2000,
								position: 'bottom',
							})
						},
					},
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
							await markdownExportService.requestPermissionIfNeeded()
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
