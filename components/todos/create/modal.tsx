import { ComponentProps } from 'react'
import TodoModal from '../TodoModal'

export function CreateTodoModal({
	...props
}: {} & ComponentProps<typeof TodoModal>) {
	return (
		<TodoModal
			id="create-todo-modal"
			{...props}
		/>
	)
}
