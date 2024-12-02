import { beforeAll, describe, expect, setSystemTime, test } from 'bun:test'
import { groupTodosByCompletedAt } from './groupTodosByCompletedAt'

beforeAll(() => {
	setSystemTime(new Date('2020-01-01T00:00:00.000Z'))
})

test('no completed todos', () => {
	expect(groupTodosByCompletedAt([])).toEqual([])
})

describe('one completed todo', () => {
	test('today', () => {
		expect(
			groupTodosByCompletedAt([
				{
					completedAt: new Date('2020-01-01T01:00:00.000Z'),
					id: '1',
					title: 'Buy milk',
				},
			]),
		).toEqual([
			{
				label: 'Today',
				todos: [
					{
						completedAt: new Date('2020-01-01T01:00:00.000Z'),
						id: '1',
						title: 'Buy milk',
					},
				],
			},
		])
	})

	test('yesterday', () => {
		expect(
			groupTodosByCompletedAt([
				{
					completedAt: new Date('2019-12-31T00:00:00.000Z'),
					id: '1',
					title: 'Buy milk',
				},
			]),
		).toEqual([
			{
				label: 'Yesterday',
				todos: [
					{
						completedAt: new Date('2019-12-31T00:00:00.000Z'),
						id: '1',
						title: 'Buy milk',
					},
				],
			},
		])
	})

	test('this week', () => {
		const mondayEnd = new Date('2019-12-30T23:59:59.999Z')
		expect(
			groupTodosByCompletedAt([
				{
					completedAt: mondayEnd,
					id: '1',
					title: 'Buy milk',
				},
			]),
		).toEqual([
			{
				label: 'This Week',
				todos: [
					{
						completedAt: mondayEnd,
						id: '1',
						title: 'Buy milk',
					},
				],
			},
		])

		const mondayStart = new Date('2019-12-30T00:00:00.000Z')
		expect(
			groupTodosByCompletedAt([
				{
					completedAt: mondayStart,
					id: '1',
					title: 'Buy milk',
				},
			]),
		).toEqual([
			{
				label: 'This Week',
				todos: [
					{
						completedAt: mondayStart,
						id: '1',
						title: 'Buy milk',
					},
				],
			},
		])
	})

	test('this year', () => {
		expect(
			groupTodosByCompletedAt([
				{
					completedAt: new Date('2019-12-29T23:59:59.999Z'),
					id: '1',
					title: 'Buy milk',
				},
			]),
		).toEqual([
			{
				label: 'This Year',
				todos: [
					{
						completedAt: new Date('2019-12-29T23:59:59.999Z'),
						id: '1',
						title: 'Buy milk',
					},
				],
			},
		])

		expect(
			groupTodosByCompletedAt([
				{
					completedAt: new Date('2019-01-01T00:00:00.000Z'),
					id: '1',
					title: 'Buy milk',
				},
			]),
		).toEqual([
			{
				label: 'This Year',
				todos: [
					{
						completedAt: new Date('2019-01-01T00:00:00.000Z'),
						id: '1',
						title: 'Buy milk',
					},
				],
			},
		])
	})
})

describe('multiple completed todos', () => {
	test('today', () => {
		expect(
			groupTodosByCompletedAt([
				{
					completedAt: new Date('2020-01-01T00:00:00.000Z'),
					id: '1',
					title: 'Buy milk',
				},
				{
					completedAt: new Date('2020-01-01T01:00:00.000Z'),
					id: '2',
					title: 'Buy more milk',
				},
				{
					completedAt: new Date('2020-01-01T02:00:00.000Z'),
					id: '3',
					title: 'MOAR MILK DAMMIT',
				},
			]),
		).toEqual([
			{
				label: 'Today',
				todos: [
					{
						completedAt: new Date('2020-01-01T00:00:00.000Z'),
						id: '1',
						title: 'Buy milk',
					},
					{
						completedAt: new Date('2020-01-01T01:00:00.000Z'),
						id: '2',
						title: 'Buy more milk',
					},
					{
						completedAt: new Date('2020-01-01T02:00:00.000Z'),
						id: '3',
						title: 'MOAR MILK DAMMIT',
					},
				],
			},
		])
	})

	test('just this week', () => {
		expect(
			groupTodosByCompletedAt([
				{
					completedAt: new Date('2019-12-30T00:00:00.000Z'),
					id: '1',
					title: 'Buy milk',
				},
				{
					completedAt: new Date('2019-12-30T01:00:00.000Z'),
					id: '2',
					title: 'Buy more milk',
				},
				{
					completedAt: new Date('2019-12-30T23:59:59.999Z'),
					id: '3',
					title: 'MOAR MILK DAMMIT',
				},
			]),
		).toEqual([
			{
				label: 'This Week',
				todos: [
					{
						completedAt: new Date('2019-12-30T00:00:00.000Z'),
						id: '1',
						title: 'Buy milk',
					},
					{
						completedAt: new Date('2019-12-30T01:00:00.000Z'),
						id: '2',
						title: 'Buy more milk',
					},
					{
						completedAt: new Date('2019-12-30T23:59:59.999Z'),
						id: '3',
						title: 'MOAR MILK DAMMIT',
					},
				],
			},
		])
	})

	test('today and yesterday', () => {
		expect(
			groupTodosByCompletedAt([
				{
					completedAt: new Date('2019-12-31T23:59:59.999Z'),
					id: '2',
					title: 'Buy more milk',
				},
				{
					completedAt: new Date('2020-01-01T00:00:00.000Z'),
					id: '1',
					title: 'Buy milk',
				},
			]),
		).toEqual([
			{
				label: 'Yesterday',
				todos: [
					{
						completedAt: new Date('2019-12-31T23:59:59.999Z'),
						id: '2',
						title: 'Buy more milk',
					},
				],
			},
			{
				label: 'Today',
				todos: [
					{
						completedAt: new Date('2020-01-01T00:00:00.000Z'),
						id: '1',
						title: 'Buy milk',
					},
				],
			},
		])
	})

	test('just yesterday and this year', () => {
		expect(
			groupTodosByCompletedAt([
				{
					completedAt: new Date('2019-12-01T00:00:00.000Z'),
					id: '1',
					title: 'Buy milk',
				},
				{
					completedAt: new Date('2019-12-01T01:00:00.000Z'),
					id: '2',
					title: 'Buy more milk',
				},
				{
					completedAt: new Date('2019-12-31T23:59:59.999Z'),
					id: '3',
					title: 'MOAR MILK DAMMIT',
				},
			]),
		).toEqual([
			{
				label: 'This Year',
				todos: [
					{
						completedAt: new Date('2019-12-01T00:00:00.000Z'),
						id: '1',
						title: 'Buy milk',
					},
					{
						completedAt: new Date('2019-12-01T01:00:00.000Z'),
						id: '2',
						title: 'Buy more milk',
					},
				],
			},
			{
				label: 'Yesterday',
				todos: [
					{
						completedAt: new Date('2019-12-31T23:59:59.999Z'),
						id: '3',
						title: 'MOAR MILK DAMMIT',
					},
				],
			},
		])
	})

	test('all date ranges', () => {})
})
