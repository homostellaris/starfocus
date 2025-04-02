import dayjs from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'
import updateLocale from 'dayjs/plugin/updateLocale'
import { LogTodoListItem, Todo } from '../db'

dayjs.extend(isBetween)
dayjs.extend(updateLocale)

dayjs.updateLocale('en', {
	weekStart: 1,
})

type Loggable = Pick<Todo, 'completedAt'>

/**
 * Groups completed todos into the following date ranges:
 *
 * - Today
 * - Yesterday
 * - This week
 * - This year
 * - Older
 *
 * @param completedTodos assumed to be in chronological order
 */
export function groupByCompletedAt(completedTodos: LogTodoListItem[]) {
	// Shame we can't rely on the database query order but this is necessary due to mixing in visits.
	completedTodos.sort(
		(a, b) => dayjs(a.completedAt).valueOf() - dayjs(b.completedAt).valueOf(),
	)

	const today = dayjs()
	const yesterday = today.subtract(1, 'day')
	const lastMonday = today.startOf('week')
	const startOfThisYear = lastMonday.startOf('year') // TODO: This might not make sense if you're on 1st of new year

	const groupMeta = [
		{
			label: 'Other',
			predicate: (_completedAt: dayjs.Dayjs) => true,
		},
		{
			label: 'Year',
			predicate: (completedAt: dayjs.Dayjs) =>
				completedAt.isBetween(startOfThisYear, lastMonday, 'day', '[]'),
		},
		{
			label: 'Week',
			predicate: (completedAt: dayjs.Dayjs) =>
				completedAt.isBetween(lastMonday, yesterday, 'day', '[]'),
		},
		{
			label: 'Yesterday',
			predicate: (completedAt: dayjs.Dayjs) =>
				completedAt.isSame(yesterday, 'day'),
		},
		{
			label: 'Today',
			predicate: (completedAt: dayjs.Dayjs) => completedAt.isSame(today, 'day'),
		},
	]
	let currentMetaIndex = groupMeta.length - 1
	let currentMeta = groupMeta[currentMetaIndex]

	const groups: Record<string, LogTodoListItem[]> = groupMeta.reduce(
		(acc, meta) => {
			acc[meta.label] = []
			return acc
		},
		{},
	)

	// Iterate over completed todos in reverse order and assign to next group once one is exhausted
	for (let i = completedTodos.length - 1; i >= 0; i--) {
		const todo = completedTodos[i]
		const completedAt = dayjs(todo.completedAt)

		while (currentMeta) {
			if (currentMeta.predicate(completedAt)) {
				groups[currentMeta.label].unshift(todo)
				break
			}
			currentMeta = groupMeta[--currentMetaIndex]
		}
	}

	return Object.entries(groups)
		.sort((a, b) => {
			const indexA = groupMeta.findIndex(meta => meta.label === a[0])
			const indexB = groupMeta.findIndex(meta => meta.label === b[0])
			return indexA - indexB
		})
		.filter(([label, todos]) => todos.length > 0 || label === 'Today') // Always include today because want to show the marker even when there are no todos yet completed
		.map(([label, todos]) => ({ label, todos }))
}
