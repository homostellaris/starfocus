import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import { Todo } from '../db'

dayjs.extend(isSameOrAfter)

export function matchesQuery(
	query: string,
	todo: Todo & { snoozedUntil?: Date },
) {
	if (
		!query &&
		todo.snoozedUntil &&
		dayjs(todo.snoozedUntil).isAfter(dayjs(), 'day')
	) {
		return false
	}
	if (!query) {
		return true
	}
	if (
		query === 'is:snoozed' &&
		todo.snoozedUntil &&
		dayjs(todo.snoozedUntil).isSameOrAfter(dayjs(), 'day')
	) {
		return true
	}
	return todo?.title.toLowerCase().includes(query)
}
