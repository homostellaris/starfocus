import { ComponentProps } from 'react'
import TodoModal from '../TodoModal'

export function EditTodoModal({ ...props }: ComponentProps<typeof TodoModal>) {
	return <TodoModal {...props} />
}
