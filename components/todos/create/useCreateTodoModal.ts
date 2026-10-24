import { useIonModal, useIonToast } from '@ionic/react'
import { HookOverlayOptions } from '@ionic/react/dist/types/hooks/HookOverlayOptions'
import { ComponentProps, createElement, useCallback, useRef } from 'react'
import { db, ListType, Todo, TodoInput } from '../../db'
import { markdownExportService } from '../../export/markdownExportService'
import { useObsidian } from '../../obsidian/useObsidian'
import { useEditTodoModal } from '../edit/useEditTodoModal'
import todoRepository from '../repository'
import { CreateTodoModal } from './modal'
import { usePostHog } from 'posthog-js/react'

export function useCreateTodoModal(): [
	({
		onWillDismiss,
		onDidDismiss,
		todo,
	}: {
		onWillDismiss?: HookOverlayOptions['onWillDismiss']
		onDidDismiss?: HookOverlayOptions['onDidDismiss']
		todo: any
	}) => void,
	(data?: any, role?: string) => void,
] {
	const posthog = usePostHog()
	const [presentToast] = useIonToast()
	const { isConfigured: isObsidianConfigured, createAndOpenNote } =
		useObsidian()
	const [presentEditTodoModal] = useEditTodoModal()
	const titleInput = useRef<HTMLIonInputElement>(null)
	const todoRef = useRef<Todo>(undefined)

	const CreateTodoModalContainer = useCallback(
		(props: ComponentProps<typeof CreateTodoModal>) =>
			createElement(CreateTodoModal, {
				...props,
				todo: todoRef.current,
			}),
		[],
	)

	const [present, dismiss] = useIonModal(CreateTodoModalContainer, {
		dismiss: (data: string, role: string) => dismiss(data, role),
		modalTitle: 'Create todo',
		titleInput,
	})

	const createTodo = useCallback(
		async (todo: TodoInput, location: ListType) => {
			if (!todo.title) throw new TypeError('Title is required')

			await markdownExportService.requestPermissionIfNeeded()
			let createdTodoIdentifier: string | undefined

			await db.transaction(
				'rw',
				db.wayfinderOrder,
				db.todos,
				async () => {
					const createdTodoId = await db.todos.add({
						createdAt: new Date(),
						starPoints: todo.starPoints,
						starRole: todo.starRole,
						title: todo.title,
						...(todo.noteInitialContent
							? { noteInitialContent: todo.noteInitialContent }
							: {}),
					})
					createdTodoIdentifier = createdTodoId.toString()
					if (location === ListType.wayfinder) {
						await todoRepository.addToTopOfWayfinder(createdTodoIdentifier)
					}
				},
			)

			if (
				todo.noteInitialContent &&
				isObsidianConfigured &&
				!markdownExportService.status$.value.isEnabled &&
				createdTodoIdentifier
			) {
				createAndOpenNote(
					{ id: createdTodoIdentifier, title: todo.title },
					todo.noteInitialContent,
				)
			}
		},
		[createAndOpenNote, isObsidianConfigured],
	)

	return [
		({
			onWillDismiss,
			onDidDismiss,
			todo,
		}: HookOverlayOptions & { todo: Todo }) => {
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
				onDidDismiss: event => {
					if (
						event.detail.data?.action === 'open_existing' &&
						event.detail.data?.existingTodo
					) {
						const existingTodo = event.detail.data.existingTodo
						presentToast({
							message: `Opened existing todo "${existingTodo.title}"`,
							duration: 2000,
							position: 'bottom',
						})
						presentEditTodoModal(existingTodo)
					}
					onDidDismiss?.(event)
				},
			})
		},
		dismiss,
	]
}
