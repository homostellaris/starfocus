import { Dispatch, SetStateAction, useEffect, useState } from 'react'
import { Todo } from './interfaces'
import todoFixture from '../todos/todos.json'

export default function useTodos(): [Todo[], Dispatch<SetStateAction<Todo[]>>] {
	const [todos, setTodos] = useState<Todo[]>([])

	useEffect(() => {
		setTodos(
			todoFixture.map(todo => ({
				...todo,
				completedAt: todo.completedAt ? new Date(todo.completedAt) : undefined,
			}))
		)
	}, [])

	useEffect(() => {
		document.addEventListener('todo completed', completeTodo)
		document.addEventListener('todo uncompleted', uncompleteTodo)

		function completeTodo(event: CustomEvent) {
			setTodos(previousTodos =>
				previousTodos.map(todo => {
					const newTodo = { ...todo }
					if (todo.id === event.detail.id) {
						newTodo.completedAt = new Date()
					}
					return newTodo
				})
			)
		}
		function uncompleteTodo(event: CustomEvent) {
			setTodos(previousTodos =>
				previousTodos.map(todo => {
					const newTodo = { ...todo }
					if (todo.id === event.detail.id) {
						newTodo.completedAt = undefined
					}
					return newTodo
				})
			)
		}

		return () => {
			document.removeEventListener('todo completed', completeTodo)
			document.removeEventListener('todo uncompleted', uncompleteTodo)
		}
	}, [])

	return [todos, setTodos]
}
