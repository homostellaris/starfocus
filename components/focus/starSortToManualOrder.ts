import { Todo } from '../db'
import { matchesQuery } from '../search/matchesQuery'
import { starSort, StarRoleOrderMap } from '../todos/starSort'

type OrderEntry = { todoId: string; order: string; snoozedUntil?: Date }

export function computeVisibleStarSortUpdates(
	entries: OrderEntry[],
	todos: Array<Todo | undefined>,
	starRoleOrderMap: StarRoleOrderMap,
	query: string,
	inActiveStarRoles: (todo: Todo) => boolean,
): OrderEntry[] {
	const visiblePairs = entries
		.map((entry, i) => ({ entry, todo: todos[i] }))
		.filter(
			({ todo, entry }) =>
				todo !== undefined &&
				matchesQuery(query, { ...todo, snoozedUntil: entry.snoozedUntil }) &&
				inActiveStarRoles(todo),
		) as Array<{ entry: OrderEntry; todo: Todo }>

	const visibleOrderSlots = visiblePairs.map(({ entry }) => entry.order)
	const sortedTodos = starSort(
		visiblePairs.map(({ todo }) => todo),
		starRoleOrderMap,
	)
	const snoozedUntilByTodoId = new Map(
		visiblePairs.map(({ entry }) => [entry.todoId, entry.snoozedUntil]),
	)

	return sortedTodos.map((todo, i) => ({
		todoId: todo.id,
		order: visibleOrderSlots[i],
		snoozedUntil: snoozedUntilByTodoId.get(todo.id),
	}))
}
