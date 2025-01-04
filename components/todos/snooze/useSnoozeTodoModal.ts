import { useIonModal } from '@ionic/react'
import { useCallback, useRef } from 'react'
import { Todo, WayfinderOrder, db } from '../../db'
import useNoteProvider from '../../notes/useNoteProvider'
import useTodoContext from '../TodoContext'
import SnoozeTodoModal from './modal'

export function useSnoozeTodoModal(): [
	(todo: Todo) => void,
	(data?: any, role?: string) => void,
] {
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
		async ({ todoId, snoozedUntil }: WayfinderOrder) => {
			await db.wayfinderOrder.update(todoId, {
				snoozedUntil,
			})
		},
		[],
	)

	return [
		(todo: Todo) => {
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
					if (event.detail.role === 'confirm') snoozeTodo(todo)
					setTodo(null)
				},
			})
		},
		dismiss,
	]
}
