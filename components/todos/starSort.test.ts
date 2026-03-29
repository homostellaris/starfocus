import { describe, expect, it } from 'bun:test'
import { Todo } from '../db'
import { starSort, StarRoleOrderMap } from './starSort'

function todo(id: string, starPoints?: number, starRole?: string): Todo {
	return { id, title: id, starPoints, starRole }
}

describe('starSort', () => {
	it('sorts by star points descending', () => {
		const map: StarRoleOrderMap = new Map()
		const result = starSort(
			[todo('a', 1), todo('b', 8), todo('c', 3)],
			map,
		)
		expect(result.map(t => t.id)).toEqual(['b', 'c', 'a'])
	})

	it('puts todos with no star points (undefined) last', () => {
		const map: StarRoleOrderMap = new Map()
		const result = starSort(
			[todo('no-points'), todo('has-points', 5), todo('also-no-points')],
			map,
		)
		expect(result.map(t => t.id)).toEqual(['has-points', 'no-points', 'also-no-points'])
	})

	it('puts todos with zero star points last', () => {
		const map: StarRoleOrderMap = new Map()
		const result = starSort([todo('zero', 0), todo('five', 5)], map)
		expect(result.map(t => t.id)).toEqual(['five', 'zero'])
	})

	it('resolves ties by star role order (lower order number wins)', () => {
		const map: StarRoleOrderMap = new Map([
			['role-1', 1],
			['role-2', 2],
		])
		const result = starSort(
			[todo('a', 3, 'role-2'), todo('b', 3, 'role-1')],
			map,
		)
		expect(result.map(t => t.id)).toEqual(['b', 'a'])
	})

	it('puts todo with no star role after those with one when tied on points', () => {
		const map: StarRoleOrderMap = new Map([['role-1', 1]])
		const result = starSort(
			[todo('no-role', 3), todo('with-role', 3, 'role-1')],
			map,
		)
		expect(result.map(t => t.id)).toEqual(['with-role', 'no-role'])
	})

	it('sorts no-points todos among themselves by star role order', () => {
		// All have 0/undefined points — star role order is the only signal
		const map: StarRoleOrderMap = new Map([
			['role-1', 1],
			['role-2', 2],
		])
		const result = starSort(
			[todo('a', 0, 'role-2'), todo('b', undefined, 'role-1')],
			map,
		)
		expect(result.map(t => t.id)).toEqual(['b', 'a'])
	})

	it('handles todos with unknown star role as lowest priority in a tie', () => {
		const map: StarRoleOrderMap = new Map([['role-1', 1]])
		const result = starSort(
			[todo('unknown-role', 5, 'role-unknown'), todo('known-role', 5, 'role-1')],
			map,
		)
		expect(result.map(t => t.id)).toEqual(['known-role', 'unknown-role'])
	})

	it('does not mutate the input array', () => {
		const map: StarRoleOrderMap = new Map()
		const todos = [todo('a', 1), todo('b', 5)]
		const original = [...todos]
		starSort(todos, map)
		expect(todos).toEqual(original)
	})

	it('returns empty array for empty input', () => {
		expect(starSort([], new Map())).toEqual([])
	})
})
