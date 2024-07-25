import { useIonModal } from '@ionic/react'
import { useCallback } from 'react'
import { Todo, db } from '../../db'
import useNoteProvider from '../../notes/useNoteProvider'
import useSelectedTodo from '../SelectedTodo'
import TodoModal from '../TodoModal'

export function EditTodoModal({
	dismiss,
	title,
	todo,
}: {
	dismiss: (data?: any, role?: string) => void
	title: string
	todo: Todo
}) {
	return (
		<TodoModal
			title={title}
			todo={todo}
			dismiss={dismiss}
		/>
	)
}
