import { IonSelect, IonSelectOption, useIonModal } from '@ionic/react'
import { HookOverlayOptions } from '@ionic/react/dist/types/hooks/HookOverlayOptions'
import { useCallback, useRef, useState } from 'react'
import { db, ListType } from '../db'
import useNoteProvider from '../notes/useNoteProvider'
import TodoModal from './TodoModal'

export function CreateTodoModal({
	dismiss,
	title,
}: {
	dismiss: (data?: any, role?: string) => void
	title: string
}) {
	const locationSelect = useRef<HTMLIonSelectElement>(null)

	return (
		<TodoModal
			dismiss={(data?: any, role?: string) => {
				dismiss(
					{
						todo: data,
						location: locationSelect.current?.value,
					},
					role,
				)
			}}
			onKeyDown={event => {
				if (event.metaKey) {
					locationSelect.current!.value = ListType.important
				}
			}}
			onKeyUp={event => {
				if (!event.metaKey) {
					locationSelect.current!.value = ListType.icebox
				}
			}}
			title={title}
			toolbarSlot={
				<IonSelect
					className="p-2"
					fill="outline"
					ref={locationSelect}
					slot="end"
					value={ListType.icebox}
				>
					<IonSelectOption value={ListType.icebox}>Icebox</IonSelectOption>
					<IonSelectOption value={ListType.important}>
						Important
					</IonSelectOption>
				</IonSelect>
			}
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
		async ({ note, title }: { note?: any; title: any }, location: ListType) => {
			let uri
			if (note && noteProvider) {
				uri = await noteProvider.create({ content: note })
			}
			db.transaction('rw', db.todos, db.lists, async () => {
				const todo = await db.todos.add({
					createdAt: new Date(),
					title,
					...(uri && { note: { uri } }),
				})
				if (location === ListType.important) {
					const list = await db.lists.get('#important')
					await db.lists.update('#important', { order: [todo, ...list!.order] })
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
