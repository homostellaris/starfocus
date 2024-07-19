import { useIonModal } from '@ionic/react'
import { HookOverlayOptions } from '@ionic/react/dist/types/hooks/HookOverlayOptions'
import { useCallback } from 'react'
import { db } from '../db'
import useNoteProvider from '../notes/useNoteProvider'
import TodoModal from './TodoModal'

export function CreateTodoModal({
	dismiss,
	title,
}: {
	dismiss: (data?: any, role?: string) => void
	title: string
}) {
	return (
		<TodoModal
			dismiss={dismiss}
			title={title}
		/>
	)
}

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
		async ({ note, title }: { note?: any; title: any }) => {
			let uri
			if (note && noteProvider) {
				uri = await noteProvider.create({ content: note })
			}
			await db.todos.add({
				createdAt: new Date(),
				title,
				...(uri && { note: { uri } }),
			})
		},
		[noteProvider],
	)

	return [
		({ onWillDismiss }: HookOverlayOptions) => {
			present({
				onWillDismiss: event => {
					const todo = event.detail.data
					if (event.detail.role === 'confirm') createTodo(todo)
					onWillDismiss?.(event)
				},
			})
		},
		dismiss,
	]
}
