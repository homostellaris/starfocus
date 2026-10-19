import { describe, expect, test } from 'bun:test'
import { BehaviorSubject } from 'rxjs'
import { Todo, StarRole, StarRoleGroup } from '../db'
import {
	enrichTodo,
	buildTodoFiles,
	deduplicateQueue,
	resolveCreatingTodoId,
	waitForCloudReady,
	CloudStateInterface,
	QueueItem,
	SyncEngineStatus,
	initialSyncEngineStatus,
	statusForFullSyncStart,
	statusForFullSyncProgress,
	shouldNotifyProgress,
	statusForFullSyncComplete,
	statusForIncrementalSyncStart,
	statusForIncrementalSyncComplete,
	statusForIncrementalSyncError,
	statusForFullSyncError,
	handleCreatingHook,
	handleUpdatingHook,
	handleDeletingHook,
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

function makeCloud(isLoggedIn: boolean | null, phase: string) {
	return {
		currentUser: { value: isLoggedIn === null ? null : { isLoggedIn } },
		syncState: new BehaviorSubject({ phase }),
	} as unknown as CloudStateInterface & { syncState: BehaviorSubject<{ phase: string }> }
}

describe('waitForCloudReady', () => {
	test('resolves immediately when not logged in', async () => {
		const cloud = makeCloud(null, 'syncing')
		await expect(waitForCloudReady(cloud)).resolves.toBeUndefined()
	})

	test('resolves immediately when already in-sync', async () => {
		const cloud = makeCloud(true, 'in-sync')
		await expect(waitForCloudReady(cloud)).resolves.toBeUndefined()
	})

	test('resolves when cloud reaches in-sync phase', async () => {
		const cloud = makeCloud(true, 'syncing')
		const promise = waitForCloudReady(cloud, 5000)
		cloud.syncState.next({ phase: 'in-sync' })
		await expect(promise).resolves.toBeUndefined()
	})

	test('resolves when cloud reaches error phase', async () => {
		const cloud = makeCloud(true, 'syncing')
		const promise = waitForCloudReady(cloud, 5000)
		cloud.syncState.next({ phase: 'error' })
		await expect(promise).resolves.toBeUndefined()
	})

	test('resolves when cloud reaches offline phase', async () => {
		const cloud = makeCloud(true, 'syncing')
		const promise = waitForCloudReady(cloud, 5000)
		cloud.syncState.next({ phase: 'offline' })
		await expect(promise).resolves.toBeUndefined()
	})

	test('resolves after timeout when cloud sync is stuck', async () => {
		const cloud = makeCloud(true, 'syncing')
		await expect(waitForCloudReady(cloud, 50)).resolves.toBeUndefined()
	})
})

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

	test('collects unique delete todo IDs', () => {
		const items: QueueItem[] = [
			{ type: 'delete', todoId: 'todo-1' },
			{ type: 'delete', todoId: 'todo-2' },
			{ type: 'delete', todoId: 'todo-1' },
		]

		const { deleteTodoIds } = deduplicateQueue(items)

		expect(deleteTodoIds.size).toBe(2)
		expect(deleteTodoIds.has('todo-1')).toBe(true)
		expect(deleteTodoIds.has('todo-2')).toBe(true)
	})

	test('separates delete filenames and delete todo IDs', () => {
		const items: QueueItem[] = [
			{ type: 'delete', filename: 'old-file.md' },
			{ type: 'delete', todoId: 'todo-1' },
		]

		const { deleteFilenames, deleteTodoIds } = deduplicateQueue(items)

		expect(deleteFilenames.has('old-file.md')).toBe(true)
		expect(deleteTodoIds.has('todo-1')).toBe(true)
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

describe('handleCreatingHook', () => {
	test('queues upsert when todoItem has id', () => {
		const queue: QueueItem[] = []
		let drainCount = 0
		const onDrain = () => {
			drainCount++
		}

		handleCreatingHook(queue, onDrain, undefined, { id: 'todo-123' })

		expect(queue).toEqual([{ type: 'upsert', todoId: 'todo-123' }])
		expect(drainCount).toBe(1)
	})

	test('queues upsert using primaryKey when todoItem lacks id', () => {
		const queue: QueueItem[] = []
		let drainCount = 0
		const onDrain = () => {
			drainCount++
		}

		handleCreatingHook(queue, onDrain, 'key-123', undefined)

		expect(queue).toEqual([{ type: 'upsert', todoId: 'key-123' }])
		expect(drainCount).toBe(1)
	})

	test('registers onsuccess callback on context when neither id nor primaryKey is available', () => {
		const queue: QueueItem[] = []
		let drainCount = 0
		const onDrain = () => {
			drainCount++
		}
		const context: { onsuccess?: (generatedKey: string) => void } = {}

		handleCreatingHook(queue, onDrain, undefined, undefined, context)

		expect(queue).toEqual([])
		expect(typeof context.onsuccess).toBe('function')

		context.onsuccess!('generated-key-1')
		expect(queue).toEqual([{ type: 'upsert', todoId: 'generated-key-1' }])
		expect(drainCount).toBe(1)
	})

	test('does not throw when neither id nor primaryKey is available and no context provided', () => {
		const queue: QueueItem[] = []
		let drainCount = 0
		const onDrain = () => {
			drainCount++
		}

		expect(() =>
			handleCreatingHook(queue, onDrain, undefined, undefined),
		).not.toThrow()
		expect(queue).toEqual([])
		expect(drainCount).toBe(0)
	})
})

describe('handleUpdatingHook', () => {
	test('queues upsert when todoItem is updated without title change', () => {
		const queue: QueueItem[] = []
		let drainCount = 0
		const onDrain = () => {
			drainCount++
		}
		const todoItem: Todo = { id: 'todo-123', title: 'Buy milk' }

		handleUpdatingHook(
			queue,
			onDrain,
			{ completedAt: new Date() },
			'todo-123',
			todoItem,
		)

		expect(queue).toEqual([{ type: 'upsert', todoId: 'todo-123' }])
		expect(drainCount).toBe(1)
	})

	test('queues delete for old filename and upsert when title is modified', () => {
		const queue: QueueItem[] = []
		let drainCount = 0
		const onDrain = () => {
			drainCount++
		}
		const todoItem: Todo = { id: 'todo-12345678', title: 'Old Title' }

		handleUpdatingHook(
			queue,
			onDrain,
			{ title: 'New Title' },
			'todo-12345678',
			todoItem,
		)

		expect(queue).toEqual([
			{ type: 'delete', filename: 'old-title_12345678.md' },
			{ type: 'upsert', todoId: 'todo-12345678' },
		])
		expect(drainCount).toBe(1)
	})

	test('queues delete with todoId when title is modified and todoItem lacks title', () => {
		const queue: QueueItem[] = []
		let drainCount = 0
		const onDrain = () => {
			drainCount++
		}
		const todoItem = { id: 'todo-12345678' } as Todo

		handleUpdatingHook(
			queue,
			onDrain,
			{ title: 'New Title' },
			'todo-12345678',
			todoItem,
		)

		expect(queue).toEqual([
			{ type: 'delete', todoId: 'todo-12345678' },
			{ type: 'upsert', todoId: 'todo-12345678' },
		])
		expect(drainCount).toBe(1)
	})

	test('queues upsert using primaryKey when todoItem is undefined', () => {
		const queue: QueueItem[] = []
		let drainCount = 0
		const onDrain = () => {
			drainCount++
		}

		handleUpdatingHook(
			queue,
			onDrain,
			{ completedAt: new Date() },
			'todo-12345678',
			undefined,
		)

		expect(queue).toEqual([{ type: 'upsert', todoId: 'todo-12345678' }])
		expect(drainCount).toBe(1)
	})

	test('queues delete with primaryKey and upsert when title is modified and todoItem is undefined', () => {
		const queue: QueueItem[] = []
		let drainCount = 0
		const onDrain = () => {
			drainCount++
		}

		handleUpdatingHook(
			queue,
			onDrain,
			{ title: 'New Title' },
			'todo-12345678',
			undefined,
		)

		expect(queue).toEqual([
			{ type: 'delete', todoId: 'todo-12345678' },
			{ type: 'upsert', todoId: 'todo-12345678' },
		])
		expect(drainCount).toBe(1)
	})

	test('does not throw when both todoItem and primaryKey are undefined', () => {
		const queue: QueueItem[] = []
		let drainCount = 0
		const onDrain = () => {
			drainCount++
		}

		expect(() =>
			handleUpdatingHook(
				queue,
				onDrain,
				{ title: 'New Title' },
				undefined,
				undefined,
			),
		).not.toThrow()
		expect(queue).toEqual([])
		expect(drainCount).toBe(0)
	})
})

describe('handleDeletingHook', () => {
	test('queues delete with generated filename when todoItem has title', () => {
		const queue: QueueItem[] = []
		let drainCount = 0
		const onDrain = () => {
			drainCount++
		}
		const todoItem: Todo = { id: 'todo-12345678', title: 'Buy milk' }

		handleDeletingHook(queue, onDrain, 'todo-12345678', todoItem)

		expect(queue).toEqual([
			{ type: 'delete', filename: 'buy-milk_12345678.md' },
		])
		expect(drainCount).toBe(1)
	})

	test('queues delete with todoId when todoItem lacks title', () => {
		const queue: QueueItem[] = []
		let drainCount = 0
		const onDrain = () => {
			drainCount++
		}
		const todoItem = { id: 'todo-12345678' } as Todo

		handleDeletingHook(queue, onDrain, 'todo-12345678', todoItem)

		expect(queue).toEqual([{ type: 'delete', todoId: 'todo-12345678' }])
		expect(drainCount).toBe(1)
	})

	test('queues delete with primaryKey when todoItem is undefined', () => {
		const queue: QueueItem[] = []
		let drainCount = 0
		const onDrain = () => {
			drainCount++
		}

		handleDeletingHook(queue, onDrain, 'todo-12345678', undefined)

		expect(queue).toEqual([{ type: 'delete', todoId: 'todo-12345678' }])
		expect(drainCount).toBe(1)
	})

	test('does not throw when both primaryKey and todoItem are undefined', () => {
		const queue: QueueItem[] = []
		let drainCount = 0
		const onDrain = () => {
			drainCount++
		}

		expect(() =>
			handleDeletingHook(queue, onDrain, undefined, undefined),
		).not.toThrow()
		expect(queue).toEqual([])
		expect(drainCount).toBe(0)
	})
})

describe('shouldNotifyProgress', () => {
	test('notifies on completion regardless of total count', () => {
		expect(shouldNotifyProgress(100, 100)).toBe(true)
		expect(shouldNotifyProgress(7, 7)).toBe(true)
		expect(shouldNotifyProgress(1, 1)).toBe(true)
	})

	test('notifies every item when total is 10 or fewer', () => {
		expect(shouldNotifyProgress(1, 8)).toBe(true)
		expect(shouldNotifyProgress(2, 8)).toBe(true)
		expect(shouldNotifyProgress(3, 8)).toBe(true)
	})

	test('notifies every 5 items when total exceeds 10', () => {
		expect(shouldNotifyProgress(5, 50)).toBe(true)
		expect(shouldNotifyProgress(10, 50)).toBe(true)
		expect(shouldNotifyProgress(15, 50)).toBe(true)
		expect(shouldNotifyProgress(1, 50)).toBe(false)
		expect(shouldNotifyProgress(2, 50)).toBe(false)
		expect(shouldNotifyProgress(4, 50)).toBe(false)
	})
})
