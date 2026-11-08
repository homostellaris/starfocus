import { ComponentProps } from 'react'
import TodoModal from '../TodoModal'

export function EditTodoModal({ ...props }: ComponentProps<typeof TodoModal>) {
	return (
		<TodoModal
			id="edit-todo-modal"
			key={props.todo?.id ?? 'edit-todo-modal'}
			{...props}
		/>
	)
}
