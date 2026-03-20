import { describe, expect, test } from 'bun:test'
import { Todo, StarRole, StarRoleGroup } from '../db'
import {
	enrichTodo,
	buildTodoFiles,
	deduplicateQueue,
	resolveCreatingTodoId,
	QueueItem,
	SyncEngineStatus,
	initialSyncEngineStatus,
	statusForFullSyncStart,
	statusForFullSyncProgress,
	statusForFullSyncComplete,
	statusForIncrementalSyncStart,
	statusForIncrementalSyncComplete,
	statusForIncrementalSyncError,
	statusForFullSyncError,
} from './syncEngine'

function makeTodo(overrides: Partial<Todo> = {}): Todo {
	return {
		id: 'todo-abc12345',
		title: 'Buy groceries',
		...overrides,
	}
}

function makeStarRole(overrides: Partial<StarRole> = {}): StarRole {
	return {
		id: 'role-1',
		title: 'Chef',
		icon: { type: 'ionicon', name: 'restaurant' },
		...overrides,
	}
}

function makeStarRoleGroup(
	overrides: Partial<StarRoleGroup> = {},
): StarRoleGroup {
	return {
		id: 'group-1',
		title: 'Life',
		...overrides,
	}
}

describe('enrichTodo', () => {
	test('returns todo without relations when no star role is set', () => {
		const todo = makeTodo()
		const result = enrichTodo(todo, new Map(), new Map())

		expect(result).toEqual({
			...todo,
			starRoleData: undefined,
			starRoleGroupData: undefined,
		})
	})

	test('attaches star role data when todo has a star role', () => {
		const starRole = makeStarRole()
		const todo = makeTodo({ starRole: 'role-1' })
		const starRolesById = new Map([['role-1', starRole]])

		const result = enrichTodo(todo, starRolesById, new Map())

		expect(result.starRoleData).toEqual(starRole)
		expect(result.starRoleGroupData).toBeUndefined()
	})

	test('attaches star role group data when star role has a group', () => {
		const group = makeStarRoleGroup()
		const starRole = makeStarRole({ starRoleGroupId: 'group-1' })
		const todo = makeTodo({ starRole: 'role-1' })
		const starRolesById = new Map([['role-1', starRole]])
		const starRoleGroupsById = new Map([['group-1', group]])

		const result = enrichTodo(todo, starRolesById, starRoleGroupsById)

		expect(result.starRoleData).toEqual(starRole)
		expect(result.starRoleGroupData).toEqual(group)
	})

	test('handles missing star role gracefully', () => {
		const todo = makeTodo({ starRole: 'nonexistent' })

		const result = enrichTodo(todo, new Map(), new Map())

		expect(result.starRoleData).toBeUndefined()
		expect(result.starRoleGroupData).toBeUndefined()
	})

	test('handles missing star role group gracefully', () => {
		const starRole = makeStarRole({ starRoleGroupId: 'nonexistent' })
		const todo = makeTodo({ starRole: 'role-1' })
		const starRolesById = new Map([['role-1', starRole]])

		const result = enrichTodo(todo, starRolesById, new Map())

		expect(result.starRoleData).toEqual(starRole)
		expect(result.starRoleGroupData).toBeUndefined()
	})
})

describe('buildTodoFiles', () => {
	test('builds todo files with filenames and content', () => {
		const todos = [makeTodo()]
		const { todoFiles } = buildTodoFiles(todos, [], [])

		expect(todoFiles).toHaveLength(1)
		expect(todoFiles[0].todoId).toBe('todo-abc12345')
		expect(todoFiles[0].filename).toMatch(/buy-groceries.*\.md$/)
		expect(todoFiles[0].content).toContain('title: Buy groceries')
	})

	test('enriches todos with star role data', () => {
		const starRole = makeStarRole()
		const todo = makeTodo({ starRole: 'role-1' })

		const { enrichedTodos } = buildTodoFiles([todo], [starRole], [])

		expect(enrichedTodos[0].starRoleData).toEqual(starRole)
	})

	test('enriches todos with star role group data', () => {
		const group = makeStarRoleGroup()
		const starRole = makeStarRole({ starRoleGroupId: 'group-1' })
		const todo = makeTodo({ starRole: 'role-1' })

		const { enrichedTodos } = buildTodoFiles([todo], [starRole], [group])

		expect(enrichedTodos[0].starRoleGroupData).toEqual(group)
	})

	test('builds files for multiple todos', () => {
		const todos = [
			makeTodo({ id: 'todo-1', title: 'First' }),
			makeTodo({ id: 'todo-2', title: 'Second' }),
		]

		const { todoFiles } = buildTodoFiles(todos, [], [])

		expect(todoFiles).toHaveLength(2)
		expect(todoFiles[0].todoId).toBe('todo-1')
		expect(todoFiles[1].todoId).toBe('todo-2')
	})

	test('includes front matter data in each todo file', () => {
		const todos = [makeTodo()]

		const { todoFiles } = buildTodoFiles(todos, [], [])

		expect(todoFiles[0].frontMatterData).toHaveProperty('id', 'todo-abc12345')
		expect(todoFiles[0].frontMatterData).toHaveProperty(
			'title',
			'Buy groceries',
		)
	})
})

describe('resolveCreatingTodoId', () => {
	test('prefers obj.id when both are defined', () => {
		expect(resolveCreatingTodoId('obj-id', 'prim-key')).toBe('obj-id')
	})

	test('falls back to primKey when obj.id is undefined', () => {
		expect(resolveCreatingTodoId(undefined, 'prim-key')).toBe('prim-key')
	})

	test('returns null when both are undefined', () => {
		expect(resolveCreatingTodoId(undefined, undefined)).toBeNull()
	})

	test('returns null when both are empty strings', () => {
		expect(resolveCreatingTodoId('', '')).toBeNull()
	})

	test('uses obj.id when primKey is empty', () => {
		expect(resolveCreatingTodoId('obj-id', '')).toBe('obj-id')
	})
})

describe('deduplicateQueue', () => {
	test('collects unique upsert todo IDs', () => {
		const items: QueueItem[] = [
			{ type: 'upsert', todoId: 'todo-1' },
			{ type: 'upsert', todoId: 'todo-2' },
			{ type: 'upsert', todoId: 'todo-1' },
		]

		const { upsertTodoIds } = deduplicateQueue(items)

		expect(upsertTodoIds.size).toBe(2)
		expect(upsertTodoIds.has('todo-1')).toBe(true)
		expect(upsertTodoIds.has('todo-2')).toBe(true)
	})

	test('collects unique delete filenames', () => {
		const items: QueueItem[] = [
			{ type: 'delete', filename: 'file-a.md' },
			{ type: 'delete', filename: 'file-b.md' },
			{ type: 'delete', filename: 'file-a.md' },
		]

		const { deleteFilenames } = deduplicateQueue(items)

		expect(deleteFilenames.size).toBe(2)
		expect(deleteFilenames.has('file-a.md')).toBe(true)
		expect(deleteFilenames.has('file-b.md')).toBe(true)
	})

	test('separates upserts and deletes from mixed queue', () => {
		const items: QueueItem[] = [
			{ type: 'delete', filename: 'old-title.md' },
			{ type: 'upsert', todoId: 'todo-1' },
			{ type: 'upsert', todoId: 'todo-2' },
			{ type: 'delete', filename: 'deleted.md' },
		]

		const { upsertTodoIds, deleteFilenames } = deduplicateQueue(items)

		expect(upsertTodoIds.size).toBe(2)
		expect(deleteFilenames.size).toBe(2)
	})

	test('returns empty sets for empty queue', () => {
		const { upsertTodoIds, deleteFilenames } = deduplicateQueue([])

		expect(upsertTodoIds.size).toBe(0)
		expect(deleteFilenames.size).toBe(0)
	})

	test('handles title rename pattern (delete old + upsert same todo)', () => {
		const items: QueueItem[] = [
			{ type: 'delete', filename: 'old-title_abc.md' },
			{ type: 'upsert', todoId: 'todo-1' },
		]

		const { upsertTodoIds, deleteFilenames } = deduplicateQueue(items)

		expect(upsertTodoIds.has('todo-1')).toBe(true)
		expect(deleteFilenames.has('old-title_abc.md')).toBe(true)
	})
})

describe('status transitions', () => {
	test('initial status has null totalFiles', () => {
		expect(initialSyncEngineStatus.totalFiles).toBeNull()
		expect(initialSyncEngineStatus.lastSyncAt).toBeNull()
	})

	test('full sync start sets totalFiles to todo count', () => {
		const result = statusForFullSyncStart(initialSyncEngineStatus, 10)

		expect(result.totalFiles).toBe(10)
		expect(result.full.phase).toBe('in-progress')
		expect(result.full.progress).toEqual({ completed: 0, total: 10 })
	})

	test('full sync progress preserves totalFiles', () => {
		const afterStart = statusForFullSyncStart(initialSyncEngineStatus, 10)
		const result = statusForFullSyncProgress(afterStart, 5, 10)

		expect(result.totalFiles).toBe(10)
		expect(result.full.progress).toEqual({ completed: 5, total: 10 })
	})

	test('full sync complete preserves totalFiles', () => {
		const afterStart = statusForFullSyncStart(initialSyncEngineStatus, 10)
		const afterProgress = statusForFullSyncProgress(afterStart, 10, 10)
		const result = statusForFullSyncComplete(afterProgress, 10)

		expect(result.totalFiles).toBe(10)
		expect(result.full.phase).toBe('complete')
		expect(result.lastSyncAt).toBeInstanceOf(Date)
	})

	test('incremental sync start does not reset totalFiles', () => {
		const withFiles = statusForFullSyncComplete(
			statusForFullSyncStart(initialSyncEngineStatus, 10),
			10,
		)
		const result = statusForIncrementalSyncStart(withFiles)

		expect(result.totalFiles).toBe(10)
		expect(result.incremental.isSyncing).toBe(true)
	})

	test('incremental sync complete updates totalFiles', () => {
		const withFiles = statusForFullSyncComplete(
			statusForFullSyncStart(initialSyncEngineStatus, 10),
			10,
		)
		const syncResult = { created: 1, updated: 0, deleted: 0, failed: 0 }
		const result = statusForIncrementalSyncComplete(withFiles, syncResult, 11)

		expect(result.totalFiles).toBe(11)
		expect(result.lastSyncAt).toBeInstanceOf(Date)
	})

	test('incremental sync error does not reset totalFiles', () => {
		const withFiles = statusForFullSyncComplete(
			statusForFullSyncStart(initialSyncEngineStatus, 10),
			10,
		)
		const result = statusForIncrementalSyncError(withFiles, 'Something broke')

		expect(result.totalFiles).toBe(10)
		expect(result.incremental.error).toBe('Something broke')
	})

	test('full sync error does not reset totalFiles', () => {
		const withFiles = statusForFullSyncComplete(
			statusForFullSyncStart(initialSyncEngineStatus, 10),
			10,
		)
		const result = statusForFullSyncError(withFiles, 'FS error')

		expect(result.totalFiles).toBe(10)
		expect(result.full.error).toBe('FS error')
	})

	test('full lifecycle: start -> progress -> complete -> incremental', () => {
		let s: SyncEngineStatus = initialSyncEngineStatus
		expect(s.totalFiles).toBeNull()

		s = statusForFullSyncStart(s, 5)
		expect(s.totalFiles).toBe(5)

		s = statusForFullSyncProgress(s, 3, 5)
		expect(s.totalFiles).toBe(5)

		s = statusForFullSyncComplete(s, 5)
		expect(s.totalFiles).toBe(5)

		s = statusForIncrementalSyncStart(s)
		expect(s.totalFiles).toBe(5)

		s = statusForIncrementalSyncComplete(
			s,
			{ created: 1, updated: 0, deleted: 0, failed: 0 },
			6,
		)
		expect(s.totalFiles).toBe(6)
	})
})
