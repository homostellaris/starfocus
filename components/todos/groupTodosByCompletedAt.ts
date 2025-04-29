import dayjs from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'
import updateLocale from 'dayjs/plugin/updateLocale'
import { LogTodoListItem, Todo } from '../db'

dayjs.extend(isBetween)
dayjs.extend(updateLocale)

dayjs.updateLocale('en', {
	weekStart: 1,
})

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
			longLabel: 'Before this year',
			shortLabel: 'Past',
			todayDiff: Number.NEGATIVE_INFINITY,
			predicate: (_completedAt: dayjs.Dayjs) => true,
		},
		{
			longLabel: 'This year',
			shortLabel: 'Year',
			todayDiff: -365,
			predicate: (completedAt: dayjs.Dayjs) =>
				completedAt.isBetween(startOfThisYear, lastMonday, 'day', '[]'),
		},
		{
			longLabel: 'This month',
			shortLabel: 'Month',
			todayDiff: -7,
			predicate: (completedAt: dayjs.Dayjs) =>
				completedAt.isBetween(lastMonday, yesterday, 'day', '[]'),
		},
		{
			longLabel: 'This week',
			shortLabel: 'Week',
			todayDiff: -7,
			predicate: (completedAt: dayjs.Dayjs) =>
				completedAt.isBetween(lastMonday, yesterday, 'day', '[]'),
		},
		{
			longLabel: 'Yesterday',
			shortLabel: 'Yester',
			todayDiff: -1,
			predicate: (completedAt: dayjs.Dayjs) =>
				completedAt.isSame(yesterday, 'day'),
		},
		{
			longLabel: 'Today',
			shortLabel: 'Today',
			todayDiff: 0,
			predicate: (completedAt: dayjs.Dayjs) => completedAt.isSame(today, 'day'),
		},
	]
	let currentMetaIndex = groupMeta.length - 1
	let currentMeta = groupMeta[currentMetaIndex]

	const groups = groupMeta.reduce<Record<string, any>>((acc, meta) => {
		acc[meta.shortLabel] = []
		return acc
	}, {})

	// Iterate over completed todos in reverse order and assign to next group once one is exhausted
	for (let i = completedTodos.length - 1; i >= 0; i--) {
		const todo = completedTodos[i]
		const completedAt = dayjs(todo.completedAt)

		while (currentMeta) {
			if (currentMeta.predicate(completedAt)) {
				groups[currentMeta.shortLabel].unshift(todo)
				break
			}
			currentMeta = groupMeta[--currentMetaIndex]
		}
	}

	return Object.entries(groups)
		.sort((a, b) => {
			const indexA = groupMeta.findIndex(meta => meta.shortLabel === a[0])
			const indexB = groupMeta.findIndex(meta => meta.shortLabel === b[0])
			return indexA - indexB
		})
		.filter(([shortLabel, todos]) => todos.length > 0 || shortLabel === 'Today') // Always include today because want to show the marker even when there are no todos yet completed
		.map(([shortLabel, todos]) => ({
			shortLabel,
			longLabel: groupMeta.find(item => item.shortLabel === shortLabel)
				?.longLabel!,
			todos,
		}))
}
