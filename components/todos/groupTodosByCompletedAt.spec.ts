import { beforeAll, describe, expect, setSystemTime, test } from 'bun:test'
import { groupByCompletedAt } from './groupTodosByCompletedAt'

beforeAll(() => {
	setSystemTime(new Date('2020-01-01T00:00:00.000Z'))
})

test('no completed todos', () => {
	expect(groupByCompletedAt([])).toEqual([
		{
			shortLabel: 'Today',
			longLabel: 'Today',
			todos: [],
		},
	])
})

describe('one completed todo', () => {
	test('today', () => {
		expect(
			groupByCompletedAt([
				{
					completedAt: new Date('2020-01-01T01:00:00.000Z'),
					id: '1',
					title: 'Buy milk',
				},
			]),
		).toEqual([
			{
				shortLabel: 'Today',
				longLabel: 'Today',
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
			groupByCompletedAt([
				{
					completedAt: new Date('2019-12-31T00:00:00.000Z'),
					id: '1',
					title: 'Buy milk',
				},
			]),
		).toEqual([
			{
				shortLabel: 'Yester',
				longLabel: 'Yesterday',
				todos: [
					{
						completedAt: new Date('2019-12-31T00:00:00.000Z'),
						id: '1',
						title: 'Buy milk',
					},
				],
			},
			{
				shortLabel: 'Today',
				longLabel: 'Today',
				todos: [],
			},
		])
	})

	test('this week', () => {
		const mondayEnd = new Date('2019-12-30T23:59:59.999Z')
		expect(
			groupByCompletedAt([
				{
					completedAt: mondayEnd,
					id: '1',
					title: 'Buy milk',
				},
			]),
		).toEqual([
			{
				shortLabel: 'Week',
				longLabel: 'This week',
				todos: [
					{
						completedAt: mondayEnd,
						id: '1',
						title: 'Buy milk',
					},
				],
			},
			{
				shortLabel: 'Today',
				longLabel: 'Today',
				todos: [],
			},
		])

		const mondayStart = new Date('2019-12-30T00:00:00.000Z')
		expect(
			groupByCompletedAt([
				{
					completedAt: mondayStart,
					id: '1',
					title: 'Buy milk',
				},
			]),
		).toEqual([
			{
				shortLabel: 'Week',
				longLabel: 'This week',
				todos: [
					{
						completedAt: mondayStart,
						id: '1',
						title: 'Buy milk',
					},
				],
			},
			{
				shortLabel: 'Today',
				longLabel: 'Today',
				todos: [],
			},
		])
	})

	test('this year', () => {
		expect(
			groupByCompletedAt([
				{
					completedAt: new Date('2019-12-29T23:59:59.999Z'),
					id: '1',
					title: 'Buy milk',
				},
			]),
		).toEqual([
			{
				shortLabel: 'Year',
				longLabel: 'This year',
				todos: [
					{
						completedAt: new Date('2019-12-29T23:59:59.999Z'),
						id: '1',
						title: 'Buy milk',
					},
				],
			},
			{
				shortLabel: 'Today',
				longLabel: 'Today',
				todos: [],
			},
		])

		expect(
			groupByCompletedAt([
				{
					completedAt: new Date('2019-01-01T00:00:00.000Z'),
					id: '1',
					title: 'Buy milk',
				},
			]),
		).toEqual([
			{
				shortLabel: 'Year',
				longLabel: 'This year',
				todos: [
					{
						completedAt: new Date('2019-01-01T00:00:00.000Z'),
						id: '1',
						title: 'Buy milk',
					},
				],
			},
			{
				shortLabel: 'Today',
				longLabel: 'Today',
				todos: [],
			},
		])
	})
})

describe('multiple completed todos', () => {
	test('today', () => {
		expect(
			groupByCompletedAt([
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
				shortLabel: 'Today',
				longLabel: 'Today',
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
			groupByCompletedAt([
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
				shortLabel: 'Week',
				longLabel: 'This week',
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
			{
				shortLabel: 'Today',
				longLabel: 'Today',
				todos: [],
			},
		])
	})

	test('today and yesterday', () => {
		expect(
			groupByCompletedAt([
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
				shortLabel: 'Yester',
				longLabel: 'Yesterday',
				todos: [
					{
						completedAt: new Date('2019-12-31T23:59:59.999Z'),
						id: '2',
						title: 'Buy more milk',
					},
				],
			},
			{
				shortLabel: 'Today',
				longLabel: 'Today',
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
			groupByCompletedAt([
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
				shortLabel: 'Year',
				longLabel: 'This year',
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
				shortLabel: 'Yester',
				longLabel: 'Yesterday',
				todos: [
					{
						completedAt: new Date('2019-12-31T23:59:59.999Z'),
						id: '3',
						title: 'MOAR MILK DAMMIT',
					},
				],
			},
			{
				shortLabel: 'Today',
				longLabel: 'Today',
				todos: [],
			},
		])
	})

	test('all date ranges', () => {})
})
