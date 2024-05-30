import { createRef, useLayoutEffect, useRef, useState } from 'react'
import Starship from '../../landingPage/Journey/Starship'
import Todos from '../../todos'
import { Todo } from '../../todos/interfaces'
import { useWindowSize } from '../../common/useWindowResize'

export default function Journey({ todos }: { todos: Todo[] }) {
	const currentTodoRef = createRef<HTMLDivElement>()
	const todosRef = createRef<HTMLDivElement>()
	useMaintainScrollOffset(currentTodoRef, todosRef)

	const [starshipY, _] = useStarshipYPosition(currentTodoRef)

	return (
		<div className="relative w-4/6 p-20 m-auto">
			<div
				id="starship"
				className={`absolute left-0 m-auto h-[10vmin] w-[10vmin] transition-transform`}
				style={{ transform: `translateY(${starshipY}px)` }}
			>
				<Starship />
			</div>
			<Todos
				currentTodoRef={currentTodoRef}
				listRef={todosRef}
				todos={todos}
			/>
		</div>
	)
}

function useMaintainScrollOffset(currentTodoRef, todosRef) {
	const previousTodosHeight = useRef<number>()

	useLayoutEffect(() => {
		const currentTodoHeight = todosRef.current.scrollHeight

		if (previousTodosHeight.current) {
			const delta = currentTodoHeight - previousTodosHeight.current
			const currentScroll = document.querySelector(
				'.parallax-container',
			)!.scrollTop
			document.querySelector('.parallax-container')!.scrollTo({
				behavior: 'instant' as ScrollBehavior,
				top: currentScroll + delta,
			})
		}

		previousTodosHeight.current = currentTodoHeight
	}, [currentTodoRef, todosRef])
}

function useStarshipYPosition(currentTodoRef) {
	const size = useWindowSize()
	const [starshipY, setStarshipY] = useState<number>(0)

	// TODO: This causes it to render a second time when a todo completion changes the scroll height. But maybe that doesn't matter and maybe we can move the starship into its own component hierarchy so it doesn't re-render other things unnecessarily.
	useLayoutEffect(() => {
		const elementPadding = 80
		const starshipImagePadding = 10
		setStarshipY(
			currentTodoRef.current.offsetTop - elementPadding - starshipImagePadding,
		)
	}, [currentTodoRef, size, setStarshipY])

	return [starshipY, setStarshipY]
}
