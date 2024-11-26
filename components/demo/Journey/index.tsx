import { createRef, useEffect, useLayoutEffect, useRef, useState } from 'react'
import Starship from '../../common/Starship'
import { Todos } from '../../todos'
import { Todo } from '../../todos/interfaces'
import { useWindowSize } from '../../common/useWindowResize'
import { TodoPosition } from '../../todos/TodoContext'

export default function Journey({ todos }: { todos: Todo[] }) {
	const currentTodoRef = createRef<HTMLDivElement>()
	const todosRef = createRef<HTMLDivElement>()
	useMaintainScrollOffset(currentTodoRef, todosRef)

	// const [starshipY, _] = useStarshipYPosition(currentTodoRef)

	return (
		<div className="relative w-4/6 p-20 m-auto">
			<div
				id="starship"
				className={`absolute left-0 m-auto h-[10vmin] w-[10vmin] transition-transform`}
				style={{ transform: `translateY(${0}px)` }}
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

export function useStarshipYPosition(
	starship: HTMLElement | null,
	nextTodoPosition: TodoPosition,
	commonAncestor: HTMLElement | null,
) {
	console.debug('Starship position render')
	const size = useWindowSize()
	const [starshipY, setStarshipY] = useState<number>(0)

	// TODO: This causes it to render a second time when a todo completion changes the scroll height. But maybe that doesn't matter and maybe we can move the starship into its own component hierarchy so it doesn't re-render other things unnecessarily.
	useEffect(() => {
		console.debug('Starship position effect')
		if (
			starship === null ||
			nextTodoPosition === null ||
			commonAncestor === null
		)
			return setStarshipY(0)

		const commonAncestorRect = commonAncestor.getBoundingClientRect()
		const todoDistanceFromCommonAncestor = nextTodoPosition.top
		const starshipHeightAdjustment =
			(nextTodoPosition.height - starship?.offsetHeight) / 2
		const additionalOffset = 32 // Hack to accommodate the 'load more' buttons, should calculate properly based on common ancestor.

		const y =
			todoDistanceFromCommonAncestor +
			starshipHeightAdjustment +
			additionalOffset
		console.debug(`Setting startship Y to ${y}`, {
			commonAncestorRect,
			nextTodoPosition,
			todoDistanceFromCommonAncestor,
			starshipHeightAdjustment,
		})
		setStarshipY(y)
	}, [commonAncestor, nextTodoPosition, size, starship, setStarshipY])

	return [starshipY, setStarshipY]
}
