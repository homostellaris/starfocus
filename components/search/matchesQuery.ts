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

	const tokens = query.split(' ')
	const matchers: Matcher[] = tokens.map(token => {
		if (token.startsWith('#')) {
			const starPoints = token.slice(1)
			return todo => (todo.starPoints ?? 0) === Number(starPoints)
		} else if (token === 'is:snoozed') {
			return todo =>
				Boolean(
					todo.snoozedUntil &&
						dayjs(todo.snoozedUntil).isSameOrAfter(dayjs(), 'day'),
				)
		} else if (token.startsWith('id:')) {
			const targetIdentifier = token.slice(3)
			return todo => todo.id === targetIdentifier
		} else {
			const normalizedToken = token.toLowerCase()
			return todo =>
				(todo?.title ?? '').toLowerCase().includes(normalizedToken) ||
				todo.id === token
		}
	})
	return matchers.every(matcher => matcher(todo))
}

type Matcher = (todo: Todo & { snoozedUntil?: Date }) => boolean
