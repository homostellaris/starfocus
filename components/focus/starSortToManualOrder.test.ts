import { afterEach, expect, it, setSystemTime } from 'bun:test'
import { Todo } from '../db'
import { StarRoleOrderMap } from '../todos/starSort'
import { computeVisibleStarSortUpdates } from './starSortToManualOrder'

function todo(id: string, starPoints?: number, starRole?: string): Todo {
	return { id, title: id, starPoints, starRole }
}

const noFilter = () => true
const emptyMap: StarRoleOrderMap = new Map()

it('reorders all todos by star sort when all are visible', () => {
	const entries = [
		{ todoId: 'a', order: 'n' },
		{ todoId: 'b', order: 'z' },
	]
	const todos = [todo('a', 1), todo('b', 3)]

	const result = computeVisibleStarSortUpdates(
		entries,
		todos,
		emptyMap,
		'',
		noFilter,
	)

	expect(result.map(r => r.todoId)).toEqual(['b', 'a'])
	expect(result.map(r => r.order)).toEqual(['n', 'z'])
})

it('only reorders visible todos, leaving non-visible out of the result', () => {
	const entries = [
		{ todoId: 'a', order: 'n' },
		{ todoId: 'b', order: 't' },
		{ todoId: 'c', order: 'z' },
	]
	const todos = [
		todo('a', 1, 'roleX'),
		todo('b', 3, 'roleY'),
		todo('c', 5, 'roleX'),
	]
	const onlyRoleX = (t: Todo) => t.starRole === 'roleX'

	const result = computeVisibleStarSortUpdates(
		entries,
		todos,
		emptyMap,
		'',
		onlyRoleX,
	)

	expect(result.map(r => r.todoId)).toEqual(['c', 'a'])
	expect(result.map(r => r.order)).toEqual(['n', 'z'])
})

it('assigns visible slots (not new strings) to sorted todos', () => {
	const entries = [
		{ todoId: 'low', order: 'aaa' },
		{ todoId: 'high', order: 'zzz' },
	]
	const todos = [todo('low', 1), todo('high', 9)]

	const result = computeVisibleStarSortUpdates(
		entries,
		todos,
		emptyMap,
		'',
		noFilter,
	)

	expect(result[0]).toMatchObject({ todoId: 'high', order: 'aaa' })
	expect(result[1]).toMatchObject({ todoId: 'low', order: 'zzz' })
})

it('preserves snoozedUntil with its todo when slots are redistributed', () => {
	const snoozedDate = new Date('2026-04-01')
	const entries = [
		{ todoId: 'a', order: 'n', snoozedUntil: snoozedDate },
		{ todoId: 'b', order: 'z' },
	]
	const todos = [todo('a', 1), todo('b', 5)]

	const result = computeVisibleStarSortUpdates(
		entries,
		todos,
		emptyMap,
		'',
		noFilter,
	)

	const aResult = result.find(r => r.todoId === 'a')
	const bResult = result.find(r => r.todoId === 'b')
	expect(aResult?.snoozedUntil).toEqual(snoozedDate)
	expect(bResult?.snoozedUntil).toBeUndefined()
})

it('excludes snoozed todos from updates when there is no query', () => {
	setSystemTime(new Date('2026-04-10'))

	const entries = [
		{ todoId: 'active', order: 'n' },
		{ todoId: 'snoozed', order: 't', snoozedUntil: new Date('2026-04-15') },
		{ todoId: 'also-active', order: 'z' },
	]
	const todos = [todo('active', 1), todo('snoozed', 9), todo('also-active', 5)]

	const result = computeVisibleStarSortUpdates(
		entries,
		todos,
		emptyMap,
		'',
		noFilter,
	)

	expect(result.map(r => r.todoId)).toEqual(['also-active', 'active'])
	expect(result.map(r => r.order)).toEqual(['n', 'z'])
})

afterEach(() => setSystemTime())

it('returns empty array when there are no entries', () => {
	const result = computeVisibleStarSortUpdates([], [], emptyMap, '', noFilter)

	expect(result).toEqual([])
})

it('returns empty array when no todos match the filter', () => {
	const entries = [{ todoId: 'a', order: 'n' }]
	const todos = [todo('a', 5, 'roleX')]
	const noneMatch = () => false

	const result = computeVisibleStarSortUpdates(
		entries,
		todos,
		emptyMap,
		'',
		noneMatch,
	)

	expect(result).toEqual([])
})

it('returns single todo unchanged when it is the only visible one', () => {
	const entries = [{ todoId: 'a', order: 'n' }]
	const todos = [todo('a', 5)]

	const result = computeVisibleStarSortUpdates(
		entries,
		todos,
		emptyMap,
		'',
		noFilter,
	)

	expect(result).toEqual([{ todoId: 'a', order: 'n', snoozedUntil: undefined }])
})
