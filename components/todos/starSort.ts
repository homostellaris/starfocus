import { Todo } from '../db'

export type StarRoleOrderMap = Map<string, number>

/**
 * Sorts todos by star points (descending), resolving ties by star role order.
 * Todos with no star points (undefined or 0) always come last, ordered among
 * themselves by star role order.
 *
 * Does not mutate the input array.
 */
export function starSort<T extends Pick<Todo, 'starPoints' | 'starRole'>>(
	todos: T[],
	starRoleOrderMap: StarRoleOrderMap,
): T[] {
	return [...todos].sort((a, b) => {
		const aPoints = a.starPoints ?? 0
		const bPoints = b.starPoints ?? 0

		if (aPoints !== bPoints) {
			if (aPoints === 0) return 1 // a has no points → goes last
			if (bPoints === 0) return -1 // b has no points → a goes first
			return bPoints - aPoints // higher points first
		}

		// Same star points (including both 0) — resolve by star role order
		return starRoleOrder(a, b, starRoleOrderMap)
	})
}

function starRoleOrder<T extends Pick<Todo, 'starRole'>>(
	a: T,
	b: T,
	starRoleOrderMap: StarRoleOrderMap,
): number {
	const aOrder = a.starRole ? (starRoleOrderMap.get(a.starRole) ?? Infinity) : Infinity
	const bOrder = b.starRole ? (starRoleOrderMap.get(b.starRole) ?? Infinity) : Infinity
	return aOrder - bOrder
}
