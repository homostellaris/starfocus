import { expect, it } from 'bun:test'
import { Todo, Visit, WayfinderOrder } from '../db'
import { attachWayfinderMetadata } from './wayfinder'

function createTodo(identifier: string, title = identifier): Todo {
	return {
		id: identifier,
		title,
	}
}

function createVisit(todoIdentifier: string, date = new Date()): Visit {
	return {
		todoId: todoIdentifier,
		date,
	}
}

function createWayfinderOrder(todoIdentifier: string, order = 'a'): WayfinderOrder {
	return {
		todoId: todoIdentifier,
		order,
	}
}

const allowAllStarRoles = () => true

it('attaches visits, order, and snooze data to existing todos', () => {
	const todos: (Todo | undefined)[] = [
		createTodo('todo-1', 'First Todo'),
		createTodo('todo-2', 'Second Todo'),
	]
	const visits: Visit[] = [
		createVisit('todo-1'),
		createVisit('todo-1'),
	]
	const wayfinderOrder: WayfinderOrder[] = [
		createWayfinderOrder('todo-1', 'order-1'),
		createWayfinderOrder('todo-2', 'order-2'),
	]

	const result = attachWayfinderMetadata(
		todos,
		visits,
		wayfinderOrder,
		'',
		allowAllStarRoles,
	)

	expect(result).toHaveLength(2)
	expect(result[0].id).toBe('todo-1')
	expect(result[0].order).toBe('order-1')
	expect(result[0].visits).toHaveLength(2)
	expect(result[1].id).toBe('todo-2')
	expect(result[1].order).toBe('order-2')
	expect(result[1].visits).toBeUndefined()
})

it('filters by query and star role', () => {
	const todos: (Todo | undefined)[] = [
		createTodo('todo-1', 'Alpha Task'),
		createTodo('todo-2', 'Beta Task'),
	]
	const wayfinderOrder: WayfinderOrder[] = [
		createWayfinderOrder('todo-1', 'a'),
		createWayfinderOrder('todo-2', 'b'),
	]

	const result = attachWayfinderMetadata(
		todos,
		[],
		wayfinderOrder,
		'alpha',
		allowAllStarRoles,
	)

	expect(result).toHaveLength(1)
	expect(result[0].id).toBe('todo-1')
})

it('handles undefined todos without throwing when orphaned entries exist', () => {
	const todos: (Todo | undefined)[] = [
		createTodo('todo-1', 'Existing Todo'),
		undefined,
		createTodo('todo-3', 'Another Existing Todo'),
	]
	const wayfinderOrder: WayfinderOrder[] = [
		createWayfinderOrder('todo-1', 'a'),
		createWayfinderOrder('deleted-todo-2', 'b'),
		createWayfinderOrder('todo-3', 'c'),
	]

	const result = attachWayfinderMetadata(
		todos,
		[],
		wayfinderOrder,
		'',
		allowAllStarRoles,
	)

	expect(result).toHaveLength(2)
	expect(result.map(item => item.id)).toEqual(['todo-1', 'todo-3'])
	expect(result.map(item => item.order)).toEqual(['a', 'c'])
})

it('returns empty array when all todos are undefined', () => {
	const todos: (Todo | undefined)[] = [undefined, undefined]
	const wayfinderOrder: WayfinderOrder[] = [
		createWayfinderOrder('orphan-1', 'a'),
		createWayfinderOrder('orphan-2', 'b'),
	]

	const result = attachWayfinderMetadata(
		todos,
		[],
		wayfinderOrder,
		'',
		allowAllStarRoles,
	)

	expect(result).toEqual([])
})

it('returns empty array when given empty inputs', () => {
	const result = attachWayfinderMetadata([], [], [], '', allowAllStarRoles)
	expect(result).toEqual([])
})
