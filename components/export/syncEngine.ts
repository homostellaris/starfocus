import { BehaviorSubject } from 'rxjs'
import { filter, take } from 'rxjs/operators'
import { Transaction } from 'dexie'
import debounce from 'debounce'
import { db, Todo, StarRole, StarRoleGroup } from '../db'
import {
	todoToMarkdown,
	buildFrontMatterData,
	generateFilename,
	generateStarRoleFilename,
	createStarRoleFile,
	createManifest,
	createAsteroidFieldFile,
	createWayfinderFile,
	updateFrontMatter,
	TodoWithRelations,
} from './markdown'
import {
	FileOperations,
	TodoFile,
	upsertTodoFiles,
	writeFileIfChanged,
	meaningfulContentIsUnchanged,
} from './sync'

export type QueueItem =
	| { type: 'upsert'; todoId: string }
	| { type: 'delete'; filename: string }

export function resolveCreatingTodoId(
	objId: string | undefined,
	primKey: string | undefined,
): string | null {
	const todoId = objId ?? primKey
	return todoId || null
}

export function deduplicateQueue(items: QueueItem[]): {
	upsertTodoIds: Set<string>
	deleteFilenames: Set<string>
} {
	const upsertTodoIds = new Set<string>()
	const deleteFilenames = new Set<string>()

	for (const item of items) {
		if (item.type === 'upsert') {
			upsertTodoIds.add(item.todoId)
		} else {
			deleteFilenames.add(item.filename)
		}
	}

	return { upsertTodoIds, deleteFilenames }
}

export interface IncrementalSyncStatus {
	isSyncing: boolean
	lastSyncAt: Date | null
	lastSyncResult: {
		created: number
		updated: number
		deleted: number
		failed: number
	} | null
	error: string | null
}

export interface FullSyncStatus {
	phase: 'idle' | 'in-progress' | 'complete'
	progress: { completed: number; total: number } | null
	error: string | null
}

export interface SyncEngineStatus {
	incremental: IncrementalSyncStatus
	full: FullSyncStatus
	totalFiles: number | null
	lastSyncAt: Date | null
}

export const initialSyncEngineStatus: SyncEngineStatus = {
	incremental: {
		isSyncing: false,
		lastSyncAt: null,
		lastSyncResult: null,
		error: null,
	},
	full: {
		phase: 'idle',
		progress: null,
		error: null,
	},
	totalFiles: null,
	lastSyncAt: null,
}

export function statusForFullSyncStart(
	current: SyncEngineStatus,
	totalTodoCount: number,
): SyncEngineStatus {
	return {
		...current,
		full: {
			phase: 'in-progress',
			progress: { completed: 0, total: totalTodoCount },
			error: null,
		},
		totalFiles: totalTodoCount,
	}
}

export function statusForFullSyncProgress(
	current: SyncEngineStatus,
	completed: number,
	total: number,
): SyncEngineStatus {
	return {
		...current,
		full: {
			phase: 'in-progress',
			progress: { completed, total },
			error: null,
		},
		totalFiles: total,
	}
}

export function statusForFullSyncComplete(
	current: SyncEngineStatus,
	totalTodoCount: number,
): SyncEngineStatus {
	return {
		...current,
		full: { phase: 'complete', progress: null, error: null },
		totalFiles: totalTodoCount,
		lastSyncAt: new Date(),
	}
}

export function statusForIncrementalSyncStart(
	current: SyncEngineStatus,
): SyncEngineStatus {
	return {
		...current,
		incremental: {
			...current.incremental,
			isSyncing: true,
			error: null,
		},
	}
}

export function statusForIncrementalSyncComplete(
	current: SyncEngineStatus,
	result: IncrementalSyncStatus['lastSyncResult'],
	totalFiles: number,
): SyncEngineStatus {
	const now = new Date()
	return {
		...current,
		incremental: {
			isSyncing: false,
			lastSyncAt: now,
			lastSyncResult: result,
			error: null,
		},
		totalFiles,
		lastSyncAt: now,
	}
}

export function statusForIncrementalSyncError(
	current: SyncEngineStatus,
	error: string,
): SyncEngineStatus {
	return {
		...current,
		incremental: {
			...current.incremental,
			isSyncing: false,
			error,
		},
	}
}

export function statusForFullSyncError(
	current: SyncEngineStatus,
	error: string,
): SyncEngineStatus {
	return {
		...current,
		full: {
			...current.full,
			phase: 'idle',
			error,
		},
	}
}

export interface SyncEngine {
	start(
		ops: FileOperations,
		writeManifest: (content: string) => Promise<void>,
	): void
	stop(): void
	syncNow(
		ops: FileOperations,
		writeManifest: (content: string) => Promise<void>,
	): Promise<void>
	runFullSync(
		ops: FileOperations,
		writeManifest: (content: string) => Promise<void>,
	): Promise<void>
	status: BehaviorSubject<SyncEngineStatus>
}

const SYNC_DEBOUNCE_MS = 2000
const CLOUD_SYNC_TIMEOUT_MS = 30000
const FULL_SYNC_PROGRESS_KEY = 'starfocus-full-sync-progress'
const PROGRESS_DB_NAME = 'starfocus-file-handles'
const PROGRESS_STORE_NAME = 'handles'

interface FullSyncProgress {
	todoIds: string[]
	completedIds: string[]
	status: 'in-progress' | 'complete'
	startedAt: number
}

async function loadFullSyncProgress(): Promise<FullSyncProgress | null> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(PROGRESS_DB_NAME, 1)
		request.onerror = () => reject(request.error)
		request.onupgradeneeded = () => {
			const idb = request.result
			if (!idb.objectStoreNames.contains(PROGRESS_STORE_NAME)) {
				idb.createObjectStore(PROGRESS_STORE_NAME)
			}
		}
		request.onsuccess = () => {
			const idb = request.result
			const tx = idb.transaction(PROGRESS_STORE_NAME, 'readonly')
			const store = tx.objectStore(PROGRESS_STORE_NAME)
			const getRequest = store.get(FULL_SYNC_PROGRESS_KEY)
			getRequest.onerror = () => {
				idb.close()
				reject(getRequest.error)
			}
			getRequest.onsuccess = () => {
				idb.close()
				resolve(getRequest.result || null)
			}
		}
	})
}

async function saveFullSyncProgress(
	progress: FullSyncProgress | null,
): Promise<void> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(PROGRESS_DB_NAME, 1)
		request.onerror = () => reject(request.error)
		request.onupgradeneeded = () => {
			const idb = request.result
			if (!idb.objectStoreNames.contains(PROGRESS_STORE_NAME)) {
				idb.createObjectStore(PROGRESS_STORE_NAME)
			}
		}
		request.onsuccess = () => {
			const idb = request.result
			const tx = idb.transaction(PROGRESS_STORE_NAME, 'readwrite')
			const store = tx.objectStore(PROGRESS_STORE_NAME)
			if (progress) {
				store.put(progress, FULL_SYNC_PROGRESS_KEY)
			} else {
				store.delete(FULL_SYNC_PROGRESS_KEY)
			}
			tx.oncomplete = () => {
				idb.close()
				resolve()
			}
			tx.onerror = () => {
				idb.close()
				reject(tx.error)
			}
		}
	})
}

export function enrichTodo(
	todo: Todo,
	starRolesById: Map<string, StarRole>,
	starRoleGroupsById: Map<string, StarRoleGroup>,
): TodoWithRelations {
	const starRoleData = todo.starRole
		? starRolesById.get(todo.starRole)
		: undefined
	const starRoleGroupData = starRoleData?.starRoleGroupId
		? starRoleGroupsById.get(starRoleData.starRoleGroupId)
		: undefined
	return { ...todo, starRoleData, starRoleGroupData }
}

async function loadRelationMaps(): Promise<{
	starRolesById: Map<string, StarRole>
	starRoleGroupsById: Map<string, StarRoleGroup>
	starRoles: StarRole[]
	starRoleGroups: StarRoleGroup[]
}> {
	const [starRoles, starRoleGroups] = await Promise.all([
		db.starRoles.toArray(),
		db.starRoleGroups.toArray(),
	])
	return {
		starRolesById: new Map(starRoles.map(sr => [sr.id, sr])),
		starRoleGroupsById: new Map(starRoleGroups.map(g => [g.id, g])),
		starRoles,
		starRoleGroups,
	}
}

async function writeAggregateFiles(
	ops: FileOperations,
	writeManifest: (content: string) => Promise<void>,
): Promise<void> {
	const [todos, starRoles, starRoleGroups, asteroidFieldOrder, wayfinderOrder] =
		await Promise.all([
			db.todos.toArray(),
			db.starRoles.toArray(),
			db.starRoleGroups.toArray(),
			db.asteroidFieldOrder.orderBy('order').toArray(),
			db.wayfinderOrder.orderBy('order').toArray(),
		])

	const starRolesById = new Map(starRoles.map(sr => [sr.id, sr]))
	const starRoleGroupsById = new Map(starRoleGroups.map(g => [g.id, g]))
	const enrichedTodos = todos.map(t =>
		enrichTodo(t, starRolesById, starRoleGroupsById),
	)

	const manifest = createManifest(enrichedTodos, starRoles, starRoleGroups)
	await writeManifest(manifest)

	await writeFileIfChanged(
		'_asteroid-field.md',
		createAsteroidFieldFile(asteroidFieldOrder, todos),
		ops,
	)
	await writeFileIfChanged(
		'_wayfinder.md',
		createWayfinderFile(wayfinderOrder, todos),
		ops,
	)

	for (const starRole of starRoles) {
		const group = starRole.starRoleGroupId
			? starRoleGroupsById.get(starRole.starRoleGroupId)
			: undefined
		await writeFileIfChanged(
			`star-roles/${generateStarRoleFilename(starRole)}`,
			createStarRoleFile(starRole, group),
			ops,
		)
	}
}

export type CloudStateInterface = Pick<typeof db.cloud, 'currentUser' | 'syncState'>

export function waitForCloudReady(
	cloud: CloudStateInterface,
	timeoutMs: number = CLOUD_SYNC_TIMEOUT_MS,
): Promise<void> {
	return new Promise(resolve => {
		const user = cloud.currentUser.value
		if (!user?.isLoggedIn) {
			console.debug('Sync engine: not logged in, proceeding immediately')
			resolve()
			return
		}

		const phase = cloud.syncState.value.phase
		if (phase === 'in-sync') {
			console.debug('Sync engine: already in-sync, proceeding')
			resolve()
			return
		}

		console.debug('Sync engine: waiting for cloud sync, current phase:', phase)
		const timeout = setTimeout(() => {
			console.debug('Sync engine: cloud sync timeout, proceeding anyway')
			subscription.unsubscribe()
			resolve()
		}, timeoutMs)

		const subscription = cloud.syncState
			.pipe(
				filter(
					state =>
						state.phase === 'in-sync' ||
						state.phase === 'error' ||
						state.phase === 'offline',
				),
				take(1),
			)
			.subscribe(state => {
				console.debug('Sync engine: cloud reached phase:', state.phase)
				clearTimeout(timeout)
				subscription.unsubscribe()
				resolve()
			})
	})
}

export function buildTodoFiles(
	todos: Todo[],
	starRoles: StarRole[],
	starRoleGroups: StarRoleGroup[],
): { todoFiles: TodoFile[]; enrichedTodos: TodoWithRelations[] } {
	const starRolesById = new Map(starRoles.map(sr => [sr.id, sr]))
	const starRoleGroupsById = new Map(starRoleGroups.map(g => [g.id, g]))

	const enrichedTodos: TodoWithRelations[] = todos.map(todo =>
		enrichTodo(todo, starRolesById, starRoleGroupsById),
	)

	const todoFiles: TodoFile[] = enrichedTodos.map(todo => ({
		todoId: todo.id,
		filename: generateFilename(todo),
		content: todoToMarkdown(todo),
		frontMatterData: buildFrontMatterData(todo),
	}))

	return { todoFiles, enrichedTodos }
}

async function performFullSync(
	ops: FileOperations,
	writeManifest: (content: string) => Promise<void>,
): Promise<SyncEngineStatus['incremental']['lastSyncResult']> {
	const [todos, starRoles, starRoleGroups, asteroidFieldOrder, wayfinderOrder] =
		await Promise.all([
			db.todos.toArray(),
			db.starRoles.toArray(),
			db.starRoleGroups.toArray(),
			db.asteroidFieldOrder.orderBy('order').toArray(),
			db.wayfinderOrder.orderBy('order').toArray(),
		])

	const { todoFiles, enrichedTodos } = buildTodoFiles(
		todos,
		starRoles,
		starRoleGroups,
	)

	const result = await upsertTodoFiles(todoFiles, ops)

	const manifest = createManifest(enrichedTodos, starRoles, starRoleGroups)
	await writeManifest(manifest)

	await writeFileIfChanged(
		'_asteroid-field.md',
		createAsteroidFieldFile(asteroidFieldOrder, todos),
		ops,
	)
	await writeFileIfChanged(
		'_wayfinder.md',
		createWayfinderFile(wayfinderOrder, todos),
		ops,
	)

	console.debug('Markdown export full sync completed:', result)
	return result
}

export function createSyncEngine(): SyncEngine {
	const status = new BehaviorSubject<SyncEngineStatus>(initialSyncEngineStatus)

	const queue: QueueItem[] = []
	let currentOps: FileOperations | null = null
	let currentWriteManifest: ((content: string) => Promise<void>) | null = null
	let drainInProgress = false
	let fullSyncAborted = false
	let stopped = false

	function onCreating(
		this: { onsuccess?: (primKey: string) => void },
		primKey: string,
		obj: Todo,
		_transaction: Transaction,
	) {
		const todoId = resolveCreatingTodoId(obj.id, primKey)
		if (todoId) {
			queue.push({ type: 'upsert', todoId })
			debouncedDrain()
		} else {
			this.onsuccess = function (generatedKey: string) {
				queue.push({ type: 'upsert', todoId: String(generatedKey) })
				debouncedDrain()
			}
		}
	}

	function onUpdating(
		this: unknown,
		modifications: Record<string, unknown>,
		_primKey: string,
		obj: Todo,
		_transaction: Transaction,
	) {
		if ('title' in modifications && modifications.title !== obj.title) {
			queue.push({ type: 'delete', filename: generateFilename(obj) })
		}
		queue.push({ type: 'upsert', todoId: obj.id })
		debouncedDrain()
	}

	function onDeleting(
		this: unknown,
		_primKey: string,
		obj: Todo,
		_transaction: Transaction,
	) {
		queue.push({ type: 'delete', filename: generateFilename(obj) })
		debouncedDrain()
	}

	const debouncedDrain = debounce(async () => {
		if (!currentOps || !currentWriteManifest) return
		if (drainInProgress) {
			debouncedDrain()
			return
		}

		drainInProgress = true

		try {
			const result = await drainQueue(currentOps, currentWriteManifest)
			if (result === null) return
			status.next(statusForIncrementalSyncStart(status.value))
			const totalFiles = await db.todos.count()
			status.next(
				statusForIncrementalSyncComplete(status.value, result, totalFiles),
			)
		} catch (error) {
			status.next(
				statusForIncrementalSyncError(status.value, (error as Error).message),
			)
		} finally {
			drainInProgress = false
			if (queue.length > 0) debouncedDrain()
		}
	}, SYNC_DEBOUNCE_MS)

	async function drainQueue(
		ops: FileOperations,
		writeManifest: (content: string) => Promise<void>,
	): Promise<IncrementalSyncStatus['lastSyncResult']> {
		const items = queue.splice(0)
		if (items.length === 0) return null

		const { upsertTodoIds, deleteFilenames } = deduplicateQueue(items)

		let created = 0
		let updated = 0
		let deleted = 0
		let failed = 0

		const { starRolesById, starRoleGroupsById } = await loadRelationMaps()

		for (const todoId of Array.from(upsertTodoIds)) {
			const todo = await db.todos.get(todoId)
			if (!todo) continue

			const enrichedTodo = enrichTodo(todo, starRolesById, starRoleGroupsById)
			const filename = generateFilename(todo)
			deleteFilenames.delete(filename)

			try {
				const existingContent = await ops.readFile(filename)
				if (existingContent !== null) {
					const newContent = todoToMarkdown(enrichedTodo)
					if (meaningfulContentIsUnchanged(existingContent, newContent)) {
						continue
					}
					const updatedContent = updateFrontMatter(existingContent, enrichedTodo)
					const success = await ops.writeFile(filename, updatedContent)
					if (success) updated++
					else failed++
				} else {
					const content = todoToMarkdown(enrichedTodo)
					const success = await ops.writeFile(filename, content)
					if (success) created++
					else failed++
				}
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error)
				throw new Error(
					`todo ${todoId} (${filename}): ${message}`,
				)
			}
		}

		for (const filename of Array.from(deleteFilenames)) {
			const success = await ops.deleteFile(filename)
			if (success) deleted++
			else failed++
		}

		await writeAggregateFiles(ops, writeManifest)

		console.debug('Incremental sync completed:', {
			created,
			updated,
			deleted,
			failed,
		})
		return { created, updated, deleted, failed }
	}

	async function runResumableFullSync(
		ops: FileOperations,
		writeManifest: (content: string) => Promise<void>,
	): Promise<void> {
		fullSyncAborted = false

		let progress = await loadFullSyncProgress()

		if (!progress || progress.status === 'complete') {
			const todoIds = (await db.todos.toCollection().primaryKeys()).map(k =>
				String(k),
			)
			progress = {
				todoIds,
				completedIds: [],
				status: 'in-progress',
				startedAt: Date.now(),
			}
			await saveFullSyncProgress(progress)
		}

		const completedSet = new Set(progress.completedIds)
		const remaining = progress.todoIds.filter(id => !completedSet.has(id))

		status.next(statusForFullSyncStart(status.value, progress.todoIds.length))

		const { starRolesById, starRoleGroupsById } = await loadRelationMaps()

		for (const todoId of remaining) {
			if (stopped || fullSyncAborted) return

			if (queue.length > 0) {
				await new Promise<void>(resolve => {
					const check = () => {
						if (stopped || fullSyncAborted) {
							resolve()
							return
						}
						if (queue.length === 0 && !drainInProgress) {
							resolve()
						} else {
							setTimeout(check, 500)
						}
					}
					check()
				})
			}
			if (stopped || fullSyncAborted) return

			const todo = await db.todos.get(todoId)
			if (todo) {
				const enrichedTodo = enrichTodo(todo, starRolesById, starRoleGroupsById)
				const filename = generateFilename(todo)
				try {
					const existingContent = await ops.readFile(filename)
					if (existingContent !== null) {
						const newContent = todoToMarkdown(enrichedTodo)
						if (!meaningfulContentIsUnchanged(existingContent, newContent)) {
							const updatedContent = updateFrontMatter(
								existingContent,
								enrichedTodo,
							)
							await ops.writeFile(filename, updatedContent)
						}
					} else {
						await ops.writeFile(filename, todoToMarkdown(enrichedTodo))
					}
				} catch (error) {
					const message = error instanceof Error ? error.message : String(error)
					throw new Error(
						`todo ${todoId} (${filename}): ${message}`,
					)
				}
			}

			progress.completedIds.push(todoId)
			if (progress.completedIds.length % 10 === 0) {
				await saveFullSyncProgress(progress)
			}

			status.next(
				statusForFullSyncProgress(
					status.value,
					progress.completedIds.length,
					progress.todoIds.length,
				),
			)
		}

		if (stopped || fullSyncAborted) return

		await writeAggregateFiles(ops, writeManifest)

		progress.status = 'complete'
		await saveFullSyncProgress(null)

		status.next(
			statusForFullSyncComplete(status.value, progress.todoIds.length),
		)

		console.debug('Full sync completed')
	}

	function stop() {
		stopped = true
		db.todos.hook('creating').unsubscribe(onCreating)
		db.todos.hook('updating').unsubscribe(onUpdating)
		db.todos.hook('deleting').unsubscribe(onDeleting)
		debouncedDrain.clear()
		queue.length = 0
		currentOps = null
		currentWriteManifest = null
	}

	function start(
		ops: FileOperations,
		writeManifest: (content: string) => Promise<void>,
	) {
		stop()
		stopped = false

		currentOps = ops
		currentWriteManifest = writeManifest

		db.todos.hook('creating', onCreating)
		db.todos.hook('updating', onUpdating)
		db.todos.hook('deleting', onDeleting)
		;(async () => {
			await waitForCloudReady(db.cloud)
			if (stopped) return
			try {
				await runResumableFullSync(ops, writeManifest)
			} catch (error) {
				console.error('Full sync error:', error)
				status.next(
					statusForFullSyncError(status.value, (error as Error).message),
				)
			}
		})()
	}

	async function syncNow(
		ops: FileOperations,
		writeManifest: (content: string) => Promise<void>,
	) {
		debouncedDrain.clear()
		queue.length = 0

		status.next(statusForIncrementalSyncStart(status.value))

		try {
			const result = await performFullSync(ops, writeManifest)
			const totalFiles = await db.todos.count()
			status.next(
				statusForIncrementalSyncComplete(status.value, result, totalFiles),
			)
		} catch (error) {
			status.next(
				statusForIncrementalSyncError(status.value, (error as Error).message),
			)
			throw error
		}
	}

	async function runFullSync(
		ops: FileOperations,
		writeManifest: (content: string) => Promise<void>,
	) {
		fullSyncAborted = true
		await saveFullSyncProgress(null)
		try {
			await runResumableFullSync(ops, writeManifest)
		} catch (error) {
			console.error('Full sync error:', error)
			status.next(
				statusForFullSyncError(status.value, (error as Error).message),
			)
			throw error
		}
	}

	return { start, stop, syncNow, runFullSync, status }
}
