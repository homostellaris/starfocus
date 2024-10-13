import { describe, expect, test } from 'bun:test'
import { calculateReorderIndices, starMudder } from './order'

describe('starMudder', () => {
	test('basic functionality', () => {
		expect(starMudder()).toEqual(['m'])
		expect(starMudder(undefined, undefined)).toEqual(['m'])
		expect(starMudder('a', 'z')).toEqual(['m'])
		expect(starMudder('a', 'z', 2)).toEqual(['i', 'q'])
	})

	test('get multiple keys', () => {
		expect(starMudder(10 as any)).toEqual([
			'c',
			'e',
			'h',
			'j',
			'l',
			'o',
			'q',
			's',
			'v',
			'x',
		])
	})
})

/**
 * | todo 0 |
 * | todo 1 |
 * | todo 2 |
 * | todo 3 |
 * | todo 4 |
 * | todo 5 |
 */
describe('calculateReorderIndices', () => {
	describe('moving todo down', () => {
		test('from index 1 to 3', () => {
			expect(calculateReorderIndices(1, 3, 6)).toEqual([3, 4])
		})

		test('from index 0 to 1', () => {
			expect(calculateReorderIndices(0, 1, 6)).toEqual([1, 2])
		})

		test('from index 3 to 5', () => {
			expect(calculateReorderIndices(3, 5, 6)).toEqual([5, 6])
		})
	})

	describe('moving todo up', () => {
		test('from index 3 to 1', () => {
			expect(calculateReorderIndices(3, 1, 6)).toEqual([0, 1])
		})

		test('from index 1 to 0', () => {
			expect(calculateReorderIndices(1, 0, 6)).toEqual([-1, 0])
		})

		test('from index 5 to 3', () => {
			expect(calculateReorderIndices(5, 3, 6)).toEqual([2, 3])
		})
	})
})
