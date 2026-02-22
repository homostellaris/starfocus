import { liveQuery, Subscription as DexieSubscription } from 'dexie'
import { BehaviorSubject, Subscription as RxSubscription } from 'rxjs'
import { filter, take } from 'rxjs/operators'
import debounce from 'debounce'
import { db, Todo, StarRole, StarRoleGroup } from '../db'
import {
	todoToMarkdown,
	buildFrontMatterData,
	generateFilename,
	createManifest,
	createAsteroidFieldFile,
	createWayfinderFile,
	TodoWithRelations,
} from './markdown'
import { FileOperations, TodoFile, upsertTodoFiles } from './sync'

export interface SyncEngineStatus {
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
	status: BehaviorSubject<SyncEngineStatus>
}

const SYNC_DEBOUNCE_MS = 2000

function buildTodoFiles(
	todos: Todo[],
	starRoles: StarRole[],
	starRoleGroups: StarRoleGroup[],
): { todoFiles: TodoFile[]; enrichedTodos: TodoWithRelations[] } {
	const starRolesById = new Map(starRoles.map(sr => [sr.id, sr]))
	const starRoleGroupsById = new Map(starRoleGroups.map(g => [g.id, g]))

	const enrichedTodos: TodoWithRelations[] = todos.map(todo => {
		const starRoleData = todo.starRole
			? starRolesById.get(todo.starRole)
			: undefined
		const starRoleGroupData = starRoleData?.starRoleGroupId
			? starRoleGroupsById.get(starRoleData.starRoleGroupId)
			: undefined
		return { ...todo, starRoleData, starRoleGroupData }
	})

	const todoFiles: TodoFile[] = enrichedTodos.map(todo => ({
		todoId: todo.id,
		filename: generateFilename(todo),
		content: todoToMarkdown(todo),
		frontMatterData: buildFrontMatterData(todo),
	}))

	return { todoFiles, enrichedTodos }
}

async function performSync(
	ops: FileOperations,
	writeManifest: (content: string) => Promise<void>,
): Promise<SyncEngineStatus['lastSyncResult']> {
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

	await ops.writeFile(
		'_asteroid-field.md',
		createAsteroidFieldFile(asteroidFieldOrder, todos),
	)
	await ops.writeFile(
		'_wayfinder.md',
		createWayfinderFile(wayfinderOrder, todos),
	)

	console.debug('Markdown export sync completed:', result)
	return result
}

function waitForCloudReady(): Promise<void> {
	return new Promise(resolve => {
		const user = db.cloud.currentUser.value
		if (!user?.isLoggedIn) {
			console.debug('Sync engine: not logged in, proceeding immediately')
			resolve()
			return
		}

		const phase = db.cloud.syncState.value.phase
		if (phase === 'in-sync') {
			console.debug('Sync engine: already in-sync, proceeding')
			resolve()
			return
		}

		console.debug('Sync engine: waiting for cloud sync, current phase:', phase)
		const subscription = db.cloud.syncState
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
				subscription.unsubscribe()
				resolve()
			})
	})
}

export function createSyncEngine(): SyncEngine {
	const status = new BehaviorSubject<SyncEngineStatus>({
		isSyncing: false,
		lastSyncAt: null,
		lastSyncResult: null,
		error: null,
	})

	let liveQuerySubscription: DexieSubscription | null = null
	let cloudWaitSubscription: RxSubscription | null = null

	function stop() {
		liveQuerySubscription?.unsubscribe()
		liveQuerySubscription = null
		cloudWaitSubscription?.unsubscribe()
		cloudWaitSubscription = null
	}

	function start(
		ops: FileOperations,
		writeManifest: (content: string) => Promise<void>,
	) {
		stop()

		let firstSync = true

		const debouncedSync = debounce(async () => {
			if (firstSync) {
				await waitForCloudReady()
				firstSync = false
			}

			status.next({ ...status.value, isSyncing: true, error: null })

			try {
				const result = await performSync(ops, writeManifest)
				status.next({
					isSyncing: false,
					lastSyncAt: new Date(),
					lastSyncResult: result,
					error: null,
				})
			} catch (error) {
				status.next({
					...status.value,
					isSyncing: false,
					error: (error as Error).message,
				})
			}
		}, SYNC_DEBOUNCE_MS)

		const observable = liveQuery(() =>
			Promise.all([
				db.todos.toArray(),
				db.starRoles.toArray(),
				db.starRoleGroups.toArray(),
				db.asteroidFieldOrder.toArray(),
				db.wayfinderOrder.toArray(),
			]),
		)

		liveQuerySubscription = observable.subscribe({
			next() {
				debouncedSync()
			},
			error(error) {
				console.error('Sync engine liveQuery error:', error)
				status.next({
					...status.value,
					error: (error as Error).message,
				})
			},
		})
	}

	async function syncNow(
		ops: FileOperations,
		writeManifest: (content: string) => Promise<void>,
	) {
		status.next({ ...status.value, isSyncing: true, error: null })

		try {
			const result = await performSync(ops, writeManifest)
			status.next({
				isSyncing: false,
				lastSyncAt: new Date(),
				lastSyncResult: result,
				error: null,
			})
		} catch (error) {
			status.next({
				...status.value,
				isSyncing: false,
				error: (error as Error).message,
			})
			throw error
		}
	}

	return { start, stop, syncNow, status }
}
