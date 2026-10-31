import { expect, it } from 'bun:test'
import { DexieStarfocus, Todo, WayfinderOrder } from '../db'
import { TodoRepository } from './repository'

function createTodo(identifier: string, title = identifier): Todo {
	return {
		id: identifier,
		title,
	}
}

function createWayfinderOrder(todoIdentifier: string, order = 'a'): WayfinderOrder {
	return {
		todoId: todoIdentifier,
		order,
	}
}

it('returns joined wayfinder todos and order metadata for existing todos', async () => {
	const orderEntries: WayfinderOrder[] = [
		createWayfinderOrder('todo-1', 'order-1'),
		createWayfinderOrder('todo-2', 'order-2'),
	]
	const todosById = new Map<string, Todo>([
		['todo-1', createTodo('todo-1', 'First Todo')],
		['todo-2', createTodo('todo-2', 'Second Todo')],
	])

	const fakeDatabase = {
		wayfinderOrder: {
			orderBy: () => ({
				toArray: async () => orderEntries,
			}),
		},
		todos: {
			bulkGet: async (identifiers: string[]) =>
				identifiers.map(identifier => todosById.get(identifier)),
		},
	} as unknown as DexieStarfocus

	const repository = new TodoRepository(fakeDatabase)
	const result = await repository.wayfinderTodos()

	expect(result).toHaveLength(2)
	expect(result[0]).toMatchObject({
		todoId: 'todo-1',
		order: 'order-1',
		id: 'todo-1',
		title: 'First Todo',
	})
	expect(result[1]).toMatchObject({
		todoId: 'todo-2',
		order: 'order-2',
		id: 'todo-2',
		title: 'Second Todo',
	})
})

it('filters out missing todos from wayfinder list without throwing', async () => {
	const orderEntries: WayfinderOrder[] = [
		createWayfinderOrder('todo-1', 'a'),
		createWayfinderOrder('deleted-todo', 'b'),
		createWayfinderOrder('todo-3', 'c'),
	]
	const todosById = new Map<string, Todo>([
		['todo-1', createTodo('todo-1')],
		['todo-3', createTodo('todo-3')],
	])

	const fakeDatabase = {
		wayfinderOrder: {
			orderBy: () => ({
				toArray: async () => orderEntries,
			}),
		},
		todos: {
			bulkGet: async (identifiers: string[]) =>
				identifiers.map(identifier => todosById.get(identifier)),
		},
	} as unknown as DexieStarfocus

	const repository = new TodoRepository(fakeDatabase)
	const result = await repository.wayfinderTodos()

	expect(result).toHaveLength(2)
	expect(result.map(item => item.todoId)).toEqual(['todo-1', 'todo-3'])
})

it('returns empty array when wayfinder order is empty', async () => {
	const fakeDatabase = {
		wayfinderOrder: {
			orderBy: () => ({
				toArray: async () => [],
			}),
		},
		todos: {
			bulkGet: async () => [],
		},
	} as unknown as DexieStarfocus

	const repository = new TodoRepository(fakeDatabase)
	const result = await repository.wayfinderTodos()

	expect(result).toEqual([])
})

it('does not prune when all wayfinder entries have existing todos', async () => {
	const orderEntries: WayfinderOrder[] = [
		createWayfinderOrder('todo-1', 'a'),
		createWayfinderOrder('todo-2', 'b'),
	]
	const todosById = new Map<string, Todo>([
		['todo-1', createTodo('todo-1')],
		['todo-2', createTodo('todo-2')],
	])
	let deletedIdentifiers: string[] = []

	const fakeDatabase = {
		wayfinderOrder: {
			toArray: async () => orderEntries,
			bulkDelete: async (identifiers: string[]) => {
				deletedIdentifiers = identifiers
			},
		},
		todos: {
			bulkGet: async (identifiers: string[]) =>
				identifiers.map(identifier => todosById.get(identifier)),
		},
	} as unknown as DexieStarfocus

	const repository = new TodoRepository(fakeDatabase)
	const pruned = await repository.pruneOrphanedWayfinderEntries()

	expect(pruned).toEqual([])
	expect(deletedIdentifiers).toEqual([])
})

it('prunes orphaned wayfinder entries whose todos no longer exist', async () => {
	const orderEntries: WayfinderOrder[] = [
		createWayfinderOrder('todo-1', 'a'),
		createWayfinderOrder('orphaned-todo-2', 'b'),
		createWayfinderOrder('orphaned-todo-3', 'c'),
	]
	const todosById = new Map<string, Todo>([['todo-1', createTodo('todo-1')]])
	let deletedIdentifiers: string[] = []

	const fakeDatabase = {
		wayfinderOrder: {
			toArray: async () => orderEntries,
			bulkDelete: async (identifiers: string[]) => {
				deletedIdentifiers = identifiers
			},
		},
		todos: {
			bulkGet: async (identifiers: string[]) =>
				identifiers.map(identifier => todosById.get(identifier)),
		},
	} as unknown as DexieStarfocus

	const repository = new TodoRepository(fakeDatabase)
	const pruned = await repository.pruneOrphanedWayfinderEntries()

	expect(pruned).toEqual(['orphaned-todo-2', 'orphaned-todo-3'])
	expect(deletedIdentifiers).toEqual(['orphaned-todo-2', 'orphaned-todo-3'])
})

it('returns empty array when pruning with an empty wayfinder table', async () => {
	const fakeDatabase = {
		wayfinderOrder: {
			toArray: async () => [],
			bulkDelete: async () => {},
		},
		todos: {
			bulkGet: async () => [],
		},
	} as unknown as DexieStarfocus

	const repository = new TodoRepository(fakeDatabase)
	const pruned = await repository.pruneOrphanedWayfinderEntries()

	expect(pruned).toEqual([])
})
