import { beforeAll, describe, expect, setSystemTime, test } from 'bun:test'
import { matchesQuery } from './matchesQuery'
import dayjs from 'dayjs'

test('should match if query is a substring of title', () => {
	expect(
		matchesQuery('foo', {
			id: '1',
			title: 'Complete that darned foobar task',
		}),
	).toBeTrue()
})

describe('snoozed todos', () => {
	const date = new Date('1999-01-01T01:00:00.000Z')
	beforeAll(() => {
		setSystemTime(date)
	})
	test('should match if snoozed until today before current time', () => {
		// midnight in current timezone
		expect(
			matchesQuery('is:snoozed', {
				id: '1',
				title: 'Complete that darned foobar task',
				snoozedUntil: dayjs(date).subtract(1, 'hour').toDate(),
			}),
		).toBeTrue()
	})
	test('should match if snoozed until today after current time', () => {
		// midnight in current timezone
		expect(
			matchesQuery('is:snoozed', {
				id: '1',
				title: 'Complete that darned foobar task',
				snoozedUntil: dayjs(date).add(1, 'hour').toDate(),
			}),
		).toBeTrue()
	})
	test('should match if snoozed until tomorrow', () => {
		expect(
			matchesQuery('is:snoozed', {
				id: '1',
				title: 'Complete that darned foobar task',
				snoozedUntil: dayjs(date).add(1, 'day').toDate(),
			}),
		).toBeTrue()
	})
	test('should not match if snoozed until yesterday', () => {
		expect(
			matchesQuery('is:snoozed', {
				id: '1',
				title: 'Complete that darned foobar task',
				snoozedUntil: dayjs(date).subtract(1, 'day').toDate(),
			}),
		).toBeFalse()
	})
	test('should not match if not actually snoozed', () => {
		expect(
			matchesQuery('is:snoozed', {
				id: '1',
				title: 'Complete that darned foobar task',
			}),
		).toBeFalse()
	})
})
