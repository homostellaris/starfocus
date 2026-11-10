import {
	ActionSheetOptions,
	useIonActionSheet,
	useIonToast,
} from '@ionic/react'
import { HookOverlayOptions } from '@ionic/react/dist/types/hooks/HookOverlayOptions'
import { createRoot, Root } from 'react-dom/client'
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
import { TodoActionSheetHeader } from './TodoActionSheetHeader'

// TODO: Make this so that todo is never null, action sheet doesn't make sense to be open if its null
export function useTodoActionSheet() {
	const posthog = usePostHog()
	const { isConfigured: isObsidianConfigured, openNote: openObsidianNote } =
		useObsidian()
	const [presentActionSheet, dismissActionSheet] = useIonActionSheet()
	const [presentToast] = useIonToast()
	const [presentEditTodoModal] = useEditTodoModal()

	return [
		async (todo: Todo, options?: ActionSheetOptions & HookOverlayOptions) => {
			const starRole = todo.starRole
				? await db.starRoles.get(todo.starRole)
				: undefined

			let headerRoot: Root | null = null

			const mountRichHeader = (actionSheetElement: Element | null) => {
				if (!actionSheetElement || headerRoot) return
				const titleElement =
					actionSheetElement.querySelector('.action-sheet-title')
				if (!titleElement) return
				titleElement.textContent = ''
				headerRoot = createRoot(titleElement)
				headerRoot.render(
					<TodoActionSheetHeader todo={todo} starRole={starRole} />,
				)
			}

			presentActionSheet({
				...options,
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
				cssClass: `todo-rich-action-sheet ${options?.cssClass || ''}`.trim(),
				id: 'todo-action-sheet',
				onWillPresent: event => {
					mountRichHeader(event.target as Element)
					options?.onWillPresent?.(event)
				},
				onDidPresent: event => {
					mountRichHeader(event.target as Element)
					options?.onDidPresent?.(event)
				},
				onDidDismiss: event => {
					if (headerRoot) {
						headerRoot.unmount()
						headerRoot = null
					}
					options?.onDidDismiss?.(event)
				},
			})
		},
		dismissActionSheet,
	]
}
