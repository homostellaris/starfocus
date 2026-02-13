import {
	type Dispatch,
	type RefObject,
	type SetStateAction,
	useEffect,
	useState,
} from 'react'
import { useWindowSize } from '../common/useWindowResize'
import { TodoPosition } from '../todos/TodoContext'

export function useStarshipYPosition(
	starship: RefObject<HTMLElement | null>,
	nextTodoPosition: TodoPosition,
	commonAncestor: RefObject<HTMLElement | null>,
): [number, Dispatch<SetStateAction<number>>] {
	console.debug('Starship position render')
	const size = useWindowSize()
	const [starshipY, setStarshipY] = useState<number>(0)

	// TODO: This causes it to render a second time when a todo completion changes the scroll height. But maybe that doesn't matter and maybe we can move the starship into its own component hierarchy so it doesn't re-render other things unnecessarily.
	useEffect(() => {
		console.debug('Starship position effect')
		if (
			starship.current === null ||
			nextTodoPosition === null ||
			commonAncestor.current === null
		)
			// eslint-disable-next-line react-hooks/set-state-in-effect -- Derived from DOM measurements
			return setStarshipY(0)

		const starshipEl = starship.current
		const commonAncestorEl = commonAncestor.current
		const commonAncestorRect = commonAncestorEl.getBoundingClientRect()
		const todoDistanceFromCommonAncestor = nextTodoPosition.top
		const starshipHeightAdjustment =
			(nextTodoPosition.height - starshipEl.offsetHeight) / 2
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
	}, [commonAncestor, nextTodoPosition, size, starship])

	return [starshipY, setStarshipY]
}
