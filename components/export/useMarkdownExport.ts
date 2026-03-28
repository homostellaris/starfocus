import {
	useCallback,
	useEffect,
	useRef,
	useState,
	Dispatch,
	SetStateAction,
} from 'react'
import { useObservable } from 'dexie-react-hooks'
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

export interface UseMarkdownExportReturn {
	status: ExportStatus
	enable: () => Promise<boolean>
	disable: () => Promise<void>
	syncNow: () => Promise<void>
	exportOnce: () => Promise<void>
	reconnect: () => Promise<void>
	runFullSync: () => Promise<void>
}

interface UiStatus {
	isSupported: boolean
	isEnabled: boolean
	needsReconnect: boolean
	directoryName: string | null
}

function makeWriteManifest(
	handle: FileSystemDirectoryHandle,
): (content: string) => Promise<void> {
	return async (content: string) => {
		const ops = createFileOperations(handle)
		await ops.writeFile('_manifest.md', content)
	}
}

function startEngine(engine: SyncEngine, handle: FileSystemDirectoryHandle) {
	engine.start(createFileOperations(handle), makeWriteManifest(handle))
}

async function runSync(engine: SyncEngine, handle: FileSystemDirectoryHandle) {
	await engine.syncNow(createFileOperations(handle), makeWriteManifest(handle))
}

function useSyncLifecycle(
	engine: SyncEngine,
	handleRef: React.MutableRefObject<FileSystemDirectoryHandle | null>,
	isSupported: boolean,
	setUiStatus: Dispatch<SetStateAction<UiStatus>>,
) {
	useEffect(() => {
		if (!isSupported) return

		getHandleFromStorage().then(async handle => {
			if (!handle) return

			const permission = await checkPermission(handle, {
				allowRequest: false,
			})

			if (permission === 'granted') {
				handleRef.current = handle
				setUiStatus(s => ({
					...s,
					isEnabled: true,
					needsReconnect: false,
					directoryName: handle.name,
				}))
				startEngine(engine, handle)
			} else if (permission === 'prompt') {
				setUiStatus(s => ({
					...s,
					isEnabled: true,
					needsReconnect: true,
					directoryName: handle.name,
				}))
			} else {
				await clearStoredDirectoryHandle()
			}
		})

		let wasLoggedIn = db.cloud.currentUser.value?.isLoggedIn ?? false
		const subscription = db.cloud.currentUser.subscribe(user => {
			const isLoggedIn = user?.isLoggedIn ?? false
			if (wasLoggedIn && !isLoggedIn) {
				engine.stop()
				handleRef.current = null
				clearStoredDirectoryHandle()
				setUiStatus(s => ({
					...s,
					isEnabled: false,
					needsReconnect: false,
					directoryName: null,
				}))
			}
			wasLoggedIn = isLoggedIn
		})

		return () => {
			subscription.unsubscribe()
			engine.stop()
		}
	}, [engine, handleRef, isSupported, setUiStatus])
}

const defaultEngineStatus: SyncEngineStatus = initialSyncEngineStatus

export default function useMarkdownExport(): UseMarkdownExportReturn {
	const [engine] = useState(() => createSyncEngine())
	const handleRef = useRef<FileSystemDirectoryHandle | null>(null)

	const engineStatus = useObservable(
		() => engine.status,
		[engine],
		defaultEngineStatus,
	)

	const [uiStatus, setUiStatus] = useState<UiStatus>(() => ({
		isSupported: isFileSystemAccessSupported(),
		isEnabled: false,
		needsReconnect: false,
		directoryName: null,
	}))

	useSyncLifecycle(engine, handleRef, uiStatus.isSupported, setUiStatus)

	const incrementalError = engineStatus.incremental.error
	const fullError = engineStatus.full.error
	const combinedError =
		incrementalError || fullError
			? [incrementalError, fullError].filter(Boolean).join('; ')
			: null

	const status: ExportStatus = {
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

	const enable = useCallback(async (): Promise<boolean> => {
		const handle = await requestDirectory()
		if (handle) {
			handleRef.current = handle
			setUiStatus(s => ({
				...s,
				isEnabled: true,
				needsReconnect: false,
				directoryName: handle.name,
			}))

			posthog.capture('markdown_export_enabled')
			startEngine(engine, handle)

			return true
		}
		return false
	}, [engine])

	const disable = useCallback(async (): Promise<void> => {
		engine.stop()
		handleRef.current = null
		await clearStoredDirectoryHandle()
		setUiStatus(s => ({
			...s,
			isEnabled: false,
			needsReconnect: false,
			directoryName: null,
		}))
		posthog.capture('markdown_export_disabled')
	}, [engine])

	const syncNow = useCallback(async (): Promise<void> => {
		if (!uiStatus.isEnabled) {
			throw new Error('Export is not enabled')
		}
		if (uiStatus.needsReconnect || !handleRef.current) {
			throw new Error('Folder access needs re-granting. Tap Reconnect first.')
		}

		await runSync(engine, handleRef.current)
	}, [engine, uiStatus.isEnabled, uiStatus.needsReconnect])

	const reconnect = useCallback(async (): Promise<void> => {
		// Try to re-use the stored handle first (avoids full picker on Android)
		const storedHandle = await getHandleFromStorage()
		if (storedHandle) {
			const permission = await checkPermission(storedHandle, {
				allowRequest: true,
			})
			if (permission === 'granted') {
				handleRef.current = storedHandle
				setUiStatus(s => ({
					...s,
					needsReconnect: false,
					directoryName: storedHandle.name,
				}))
				startEngine(engine, storedHandle)
				return
			}
		}

		// Fall back to full folder picker if no handle or permission denied
		const handle = await requestDirectory()
		if (handle) {
			handleRef.current = handle
			setUiStatus(s => ({
				...s,
				needsReconnect: false,
				directoryName: handle.name,
			}))
			startEngine(engine, handle)
		}
	}, [engine])

	const exportOnce = useCallback(async (): Promise<void> => {
		const handle = await requestDirectory()
		if (!handle) {
			throw new Error('No directory selected')
		}

		handleRef.current = handle
		await runSync(engine, handle)

		const result = engine.status.value.incremental.lastSyncResult
		if (result) {
			posthog.capture('markdown_exported', {
				files_created: result.created,
				files_updated: result.updated,
				files_deleted: result.deleted,
				files_failed: result.failed,
			})
		}

		handleRef.current = null
		await clearStoredDirectoryHandle()
		setUiStatus(s => ({
			...s,
			isEnabled: false,
			needsReconnect: false,
			directoryName: null,
		}))
	}, [engine])

	const runFullSync = useCallback(async (): Promise<void> => {
		if (!uiStatus.isEnabled) {
			throw new Error('Export is not enabled')
		}
		if (uiStatus.needsReconnect || !handleRef.current) {
			throw new Error('Folder access needs re-granting. Tap Reconnect first.')
		}

		await engine.runFullSync(
			createFileOperations(handleRef.current),
			makeWriteManifest(handleRef.current),
		)
	}, [engine, uiStatus.isEnabled, uiStatus.needsReconnect])

	return {
		status,
		enable,
		disable,
		syncNow,
		exportOnce,
		reconnect,
		runFullSync,
	}
}
