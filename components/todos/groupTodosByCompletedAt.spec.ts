import { beforeAll, describe, expect, setSystemTime, test } from 'bun:test'
import { groupByCompletedAt } from './groupTodosByCompletedAt'

beforeAll(() => {
	setSystemTime(new Date('2020-01-01T00:00:00.000Z'))
})

test('no completed todos', () => {
	expect(groupByCompletedAt([])).toEqual([
		{
			label: 'Today',
			todayDiff: 0,
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
				label: 'Today',
				todayDiff: 0,
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
				label: 'Yesterday',
				todayDiff: -1,
				todos: [
					{
						completedAt: new Date('2019-12-31T00:00:00.000Z'),
						id: '1',
						title: 'Buy milk',
					},
				],
			},
			{
				label: 'Today',
				todayDiff: 0,
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
				label: 'Week',
				todayDiff: -7,
				todos: [
					{
						completedAt: mondayEnd,
						id: '1',
						title: 'Buy milk',
					},
				],
			},
			{
				label: 'Today',
				todayDiff: 0,
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
				label: 'Week',
				todayDiff: -7,
				todos: [
					{
						completedAt: mondayStart,
						id: '1',
						title: 'Buy milk',
					},
				],
			},
			{
				label: 'Today',
				todayDiff: 0,
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
				label: 'Year',
				todayDiff: -365,
				todos: [
					{
						completedAt: new Date('2019-12-29T23:59:59.999Z'),
						id: '1',
						title: 'Buy milk',
					},
				],
			},
			{
				label: 'Today',
				todayDiff: 0,
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
				label: 'Year',
				todayDiff: -365,
				todos: [
					{
						completedAt: new Date('2019-01-01T00:00:00.000Z'),
						id: '1',
						title: 'Buy milk',
					},
				],
			},
			{
				label: 'Today',
				todayDiff: 0,
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
				label: 'Today',
				todayDiff: 0,
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
				label: 'Week',
				todayDiff: -7,
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
				label: 'Today',
				todayDiff: 0,
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
				label: 'Yesterday',
				todayDiff: -1,
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
				todayDiff: 0,
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
				label: 'Year',
				todayDiff: -365,
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
				todayDiff: -1,
				todos: [
					{
						completedAt: new Date('2019-12-31T23:59:59.999Z'),
						id: '3',
						title: 'MOAR MILK DAMMIT',
					},
				],
			},
			{
				label: 'Today',
				todayDiff: 0,
				todos: [],
			},
		])
	})

	test('all date ranges', () => {})
})
