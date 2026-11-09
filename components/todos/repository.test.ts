import { expect, it } from 'bun:test'
import { DexieStarfocus, ListType, Todo, WayfinderOrder } from '../db'
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

it('preserves existing wayfinder order when editing a wayfinder todo', async () => {
	let updatedTodoProperties: Record<string, unknown> | undefined
	let wayfinderOrderPutCalled = false
	const existingWayfinderOrder = { todoId: 'todo-middle', order: 'm' }

	const fakeDatabase = {
		transaction: async (_mode: string, ...argumentsList: unknown[]) => {
			const callback = argumentsList[argumentsList.length - 1] as () => Promise<void>
			return await callback()
		},
		todos: {
			update: async (identifier: string, updates: Record<string, unknown>) => {
				updatedTodoProperties = updates
			},
		},
		wayfinderOrder: {
			get: async (identifier: string) =>
				identifier === 'todo-middle' ? existingWayfinderOrder : undefined,
			put: async () => {
				wayfinderOrderPutCalled = true
			},
			orderBy: () => ({
				first: async () => ({ todoId: 'todo-first', order: 'a' }),
			}),
		},
		asteroidFieldOrder: {
			where: () => ({
				delete: async () => {},
			}),
		},
	} as unknown as DexieStarfocus

	const repository = new TodoRepository(fakeDatabase)
	await repository.edit(
		{
			id: 'todo-middle',
			title: 'Updated title',
			starPoints: 5,
			starRole: 'role-1',
		},
		ListType.wayfinder,
	)

	expect(updatedTodoProperties).toEqual({
		title: 'Updated title',
		starPoints: 5,
		starRole: 'role-1',
	})
	expect(wayfinderOrderPutCalled).toBe(false)
})

it('adds a database todo to the top of wayfinder when location changed to wayfinder', async () => {
	let insertedWayfinderEntry: WayfinderOrder | undefined

	const fakeDatabase = {
		transaction: async (_mode: string, ...argumentsList: unknown[]) => {
			const callback = argumentsList[argumentsList.length - 1] as () => Promise<void>
			return await callback()
		},
		todos: {
			update: async () => {},
		},
		wayfinderOrder: {
			get: async () => undefined,
			put: async (entry: WayfinderOrder) => {
				insertedWayfinderEntry = entry
			},
			orderBy: () => ({
				first: async () => ({ todoId: 'todo-first', order: 'm' }),
			}),
		},
		asteroidFieldOrder: {
			where: () => ({
				delete: async () => {},
			}),
		},
	} as unknown as DexieStarfocus

	const repository = new TodoRepository(fakeDatabase)
	await repository.edit(
		{
			id: 'database-todo',
			title: 'Moving to wayfinder',
		},
		ListType.wayfinder,
	)

	expect(insertedWayfinderEntry).toBeDefined()
	expect(insertedWayfinderEntry?.todoId).toBe('database-todo')
})

it('removes a wayfinder todo from wayfinder order when location changed to database', async () => {
	let deletedWayfinderTodoIdentifier: string | undefined

	const fakeDatabase = {
		transaction: async (_mode: string, ...argumentsList: unknown[]) => {
			const callback = argumentsList[argumentsList.length - 1] as () => Promise<void>
			return await callback()
		},
		todos: {
			update: async () => {},
		},
		wayfinderOrder: {
			where: ({ todoId }: { todoId: string }) => ({
				delete: async () => {
					deletedWayfinderTodoIdentifier = todoId
				},
			}),
		},
		asteroidFieldOrder: {
			where: () => ({
				delete: async () => {},
			}),
		},
	} as unknown as DexieStarfocus

	const repository = new TodoRepository(fakeDatabase)
	await repository.edit(
		{
			id: 'wayfinder-todo',
			title: 'Moving to database',
		},
		ListType.database,
	)

	expect(deletedWayfinderTodoIdentifier).toBe('wayfinder-todo')
})

it('throws a TypeError when editing a todo without a title', async () => {
	const fakeDatabase = {} as unknown as DexieStarfocus
	const repository = new TodoRepository(fakeDatabase)

	expect(
		repository.edit(
			{
				id: 'todo-without-title',
				title: '',
			},
			ListType.wayfinder,
		),
	).rejects.toThrow(new TypeError('Title is required'))
})
