import { BehaviorSubject, Subscription } from 'rxjs'
import posthog from 'posthog-js'
import { db } from '../db'
import {
	isFileSystemAccessSupported,
	requestDirectory,
	getHandleFromStorage,
	checkPermission,
	clearStoredDirectoryHandle,
	createFileOperations,
} from './fileSystem'
import {
	createSyncEngine,
	SyncEngine,
	SyncEngineStatus,
	IncrementalSyncStatus,
	FullSyncStatus,
	initialSyncEngineStatus,
} from './syncEngine'

export interface ExportStatus {
	isSupported: boolean
	isEnabled: boolean
	isSyncing: boolean
	needsReconnect: boolean
	lastSyncAt: Date | null
	lastSyncResult: IncrementalSyncStatus['lastSyncResult']
	error: string | null
	directoryName: string | null
	fullSync: FullSyncStatus
	totalFiles: number | null
}

export interface UiStatus {
	isSupported: boolean
	isEnabled: boolean
	needsReconnect: boolean
	directoryName: string | null
}

export function computeExportStatus(
	uiStatus: UiStatus,
	engineStatus: SyncEngineStatus,
): ExportStatus {
	const incrementalError = engineStatus.incremental.error
	const fullError = engineStatus.full.error
	const combinedError =
		incrementalError || fullError
			? [incrementalError, fullError].filter(Boolean).join('; ')
			: null

	return {
		...uiStatus,
		isSyncing:
			engineStatus.incremental.isSyncing ||
			engineStatus.full.phase === 'in-progress',
		lastSyncAt: engineStatus.lastSyncAt,
		lastSyncResult: engineStatus.incremental.lastSyncResult,
		error: combinedError,
		fullSync: engineStatus.full,
		totalFiles: engineStatus.totalFiles,
	}
}

export function makeWriteManifest(
	handle: FileSystemDirectoryHandle,
): (content: string) => Promise<void> {
	return async (content: string) => {
		const operations = createFileOperations(handle)
		await operations.writeFile('_manifest.md', content)
	}
}

export class MarkdownExportService {
	private engine: SyncEngine
	private directoryHandle: FileSystemDirectoryHandle | null = null
	private uiStatus: UiStatus
	private engineStatus: SyncEngineStatus = initialSyncEngineStatus
	private currentUserSubscription: Subscription | null = null
	private engineStatusSubscription: Subscription | null = null
	private isInitialized = false

	readonly status$: BehaviorSubject<ExportStatus>

	constructor(engine?: SyncEngine) {
		this.engine = engine ?? createSyncEngine()
		this.uiStatus = {
			isSupported: isFileSystemAccessSupported(),
			isEnabled: false,
			needsReconnect: false,
			directoryName: null,
		}
		this.status$ = new BehaviorSubject<ExportStatus>(
			computeExportStatus(this.uiStatus, this.engineStatus),
		)
	}

	initialize = async (): Promise<void> => {
		if (this.isInitialized) return
		this.isInitialized = true

		this.engineStatusSubscription = this.engine.status.subscribe(newEngineStatus => {
			this.engineStatus = newEngineStatus
			this.emitStatus()
		})

		if (!this.uiStatus.isSupported) return

		const storedHandle = await getHandleFromStorage()
		if (storedHandle) {
			const permission = await checkPermission(storedHandle, {
				allowRequest: false,
			})

			if (permission === 'granted') {
				this.directoryHandle = storedHandle
				this.uiStatus = {
					...this.uiStatus,
					isEnabled: true,
					needsReconnect: false,
					directoryName: storedHandle.name,
				}
				this.emitStatus()
				this.startSyncEngine(storedHandle)
			} else if (permission === 'prompt') {
				this.uiStatus = {
					...this.uiStatus,
					isEnabled: true,
					needsReconnect: true,
					directoryName: storedHandle.name,
				}
				this.emitStatus()
			} else {
				await clearStoredDirectoryHandle()
			}
		}

		let wasLoggedIn = db.cloud.currentUser.value?.isLoggedIn ?? false
		this.currentUserSubscription = db.cloud.currentUser.subscribe(user => {
			const isLoggedIn = user?.isLoggedIn ?? false
			if (wasLoggedIn && !isLoggedIn) {
				this.engine.stop()
				this.directoryHandle = null
				clearStoredDirectoryHandle()
				this.uiStatus = {
					...this.uiStatus,
					isEnabled: false,
					needsReconnect: false,
					directoryName: null,
				}
				this.emitStatus()
			}
			wasLoggedIn = isLoggedIn
		})
	}

	getStatus = (): ExportStatus => {
		return this.status$.value
	}

	enable = async (): Promise<boolean> => {
		const handle = await requestDirectory()
		if (handle) {
			this.directoryHandle = handle
			this.uiStatus = {
				...this.uiStatus,
				isEnabled: true,
				needsReconnect: false,
				directoryName: handle.name,
			}
			this.emitStatus()
			posthog.capture('markdown_export_enabled')
			this.startSyncEngine(handle)
			return true
		}
		return false
	}

	disable = async (): Promise<void> => {
		this.engine.stop()
		this.directoryHandle = null
		await clearStoredDirectoryHandle()
		this.uiStatus = {
			...this.uiStatus,
			isEnabled: false,
			needsReconnect: false,
			directoryName: null,
		}
		this.emitStatus()
		posthog.capture('markdown_export_disabled')
	}

	syncNow = async (): Promise<void> => {
		if (!this.uiStatus.isEnabled) {
			throw new Error('Export is not enabled')
		}
		if (this.uiStatus.needsReconnect || !this.directoryHandle) {
			throw new Error('Folder access needs re-granting. Tap Reconnect first.')
		}
		await this.engine.syncNow(
			createFileOperations(this.directoryHandle),
			makeWriteManifest(this.directoryHandle),
		)
	}

	exportOnce = async (): Promise<void> => {
		const handle = await requestDirectory()
		if (!handle) {
			throw new Error('No directory selected')
		}

		this.directoryHandle = handle
		await this.engine.syncNow(
			createFileOperations(handle),
			makeWriteManifest(handle),
		)

		const result = this.engine.status.value.incremental.lastSyncResult
		if (result) {
			posthog.capture('markdown_exported', {
				files_created: result.created,
				files_updated: result.updated,
				files_deleted: result.deleted,
				files_failed: result.failed,
			})
		}

		this.directoryHandle = null
		await clearStoredDirectoryHandle()
		this.uiStatus = {
			...this.uiStatus,
			isEnabled: false,
			needsReconnect: false,
			directoryName: null,
		}
		this.emitStatus()
	}

	reconnect = async (): Promise<void> => {
		const storedHandle = await getHandleFromStorage()
		if (storedHandle) {
			const permission = await checkPermission(storedHandle, {
				allowRequest: true,
			})
			if (permission === 'granted') {
				this.directoryHandle = storedHandle
				this.uiStatus = {
					...this.uiStatus,
					needsReconnect: false,
					directoryName: storedHandle.name,
				}
				this.emitStatus()
				this.startSyncEngine(storedHandle)
				return
			}
		}

		const handle = await requestDirectory()
		if (handle) {
			this.directoryHandle = handle
			this.uiStatus = {
				...this.uiStatus,
				needsReconnect: false,
				directoryName: handle.name,
			}
			this.emitStatus()
			this.startSyncEngine(handle)
		}
	}

	runFullSync = async (): Promise<void> => {
		if (!this.uiStatus.isEnabled) {
			throw new Error('Export is not enabled')
		}
		if (this.uiStatus.needsReconnect || !this.directoryHandle) {
			throw new Error('Folder access needs re-granting. Tap Reconnect first.')
		}

		await this.engine.runFullSync(
			createFileOperations(this.directoryHandle),
			makeWriteManifest(this.directoryHandle),
		)
	}

	requestPermissionIfNeeded = async (): Promise<void> => {
		if (!this.uiStatus.needsReconnect) return

		const storedHandle = await getHandleFromStorage()
		if (!storedHandle) return

		const permission = await checkPermission(storedHandle, { allowRequest: true })
		if (permission === 'granted') {
			this.directoryHandle = storedHandle
			this.uiStatus = {
				...this.uiStatus,
				needsReconnect: false,
				directoryName: storedHandle.name,
			}
			this.emitStatus()
			this.startSyncEngine(storedHandle)
		}
	}

	destroy = (): void => {
		this.engine.stop()
		this.engineStatusSubscription?.unsubscribe()
		this.currentUserSubscription?.unsubscribe()
		this.isInitialized = false
	}

	private startSyncEngine(handle: FileSystemDirectoryHandle): void {
		this.engine.start(
			createFileOperations(handle),
			makeWriteManifest(handle),
		)
	}

	private emitStatus(): void {
		this.status$.next(computeExportStatus(this.uiStatus, this.engineStatus))
	}
}

export const markdownExportService = new MarkdownExportService()

if (typeof window !== 'undefined') {
	markdownExportService.initialize()
}
