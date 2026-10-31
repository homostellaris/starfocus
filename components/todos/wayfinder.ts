import _ from 'lodash'
import { Todo, Visit, WayfinderOrder, WayfinderTodoListItem } from '../db'
import { matchesQuery } from '../search/matchesQuery'

export function attachWayfinderMetadata(
	wayfinderTodos: (Todo | undefined)[],
	visits: Visit[],
	wayfinderOrder: WayfinderOrder[],
	query: string,
	inActiveStarRoles: (todo: Todo) => boolean,
): WayfinderTodoListItem[] {
	const visitsByTodoId = _.groupBy(visits, 'todoId')
	const items: WayfinderTodoListItem[] = []

	for (let index = 0; index < wayfinderTodos.length; index++) {
		const todo = wayfinderTodos[index]
		if (!todo) continue

		const candidateItem: WayfinderTodoListItem = {
			...todo,
			visits: visitsByTodoId[todo.id],
			order: wayfinderOrder[index].order,
			snoozedUntil: wayfinderOrder[index].snoozedUntil,
		}

		if (matchesQuery(query, candidateItem) && inActiveStarRoles(candidateItem)) {
			items.push(candidateItem)
		}
	}

	return items
}
