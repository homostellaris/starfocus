import { useIonModal } from '@ionic/react'
import { useCallback, useRef } from 'react'
import { ListType, Todo, WayfinderOrder, db } from '../../db'
import useNoteProvider from '../../notes/useNoteProvider'
import useTodoContext from '../TodoContext'
import SnoozeTodoModal from './modal'
import { usePostHog } from 'posthog-js/react'

export function useSnoozeTodoModal(): [
	(todo: Todo, location: ListType) => void,
	(data?: any, role?: string) => void,
] {
	const posthog = usePostHog()
	const {
		selectedTodo: [todo, setTodo],
	} = useTodoContext()
	// const titleInput = useRef<HTMLIonInputElement>(null)
	const [present, dismiss] = useIonModal(SnoozeTodoModal, {
		dismiss: (data: string, role: string) => dismiss(data, role),
		title: 'Snooze todo',
		// titleInput,
		todo,
	})
	const snoozeTodo = useCallback(
		async ({ todoId, snoozedUntil }: WayfinderOrder, location: ListType) => {
			if (location === ListType.wayfinder)
				await db.wayfinderOrder.update(todoId, {
					snoozedUntil,
				})
			else if (location === ListType.asteroidField)
				await db.asteroidFieldOrder.update(todoId, {
					snoozedUntil,
				})
			else throw new Error('No list type provided')
		},
		[],
	)

	return [
		(todo: Todo, location: ListType) => {
			present({
				// cssClass: 'auto-height',
				// onDidPresent: _event => {
				// 	titleInput.current?.setFocus()
				// },
				onWillPresent: () => {
					setTodo(todo)
				},
				onWillDismiss: event => {
					const todo = event.detail.data
					if (event.detail.role === 'confirm') {
						snoozeTodo(todo, location)
						const snoozeDurationMs = todo.snoozedUntil
							? new Date(todo.snoozedUntil).getTime() - Date.now()
							: 0
						posthog.capture('todo_snoozed', {
							location,
							snooze_duration: Math.round(snoozeDurationMs / (1000 * 60)),
						})
					}
					setTodo(null)
				},
			})
		},
		dismiss,
	]
}
