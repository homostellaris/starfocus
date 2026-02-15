import {
	useCallback,
	useEffect,
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
	getStoredDirectoryHandle,
	clearStoredDirectoryHandle,
	createFileOperations,
	writeFile,
} from './fileSystem'
import { createSyncEngine, SyncEngine, SyncEngineStatus } from './syncEngine'

export interface ExportStatus {
	isSupported: boolean
	isEnabled: boolean
	isSyncing: boolean
	lastSyncAt: Date | null
	lastSyncResult: {
		created: number
		updated: number
		deleted: number
		failed: number
	} | null
	error: string | null
	directoryName: string | null
}

export interface UseMarkdownExportReturn {
	status: ExportStatus
	enable: () => Promise<boolean>
	disable: () => Promise<void>
	syncNow: () => Promise<void>
	exportOnce: () => Promise<void>
}

interface UiStatus {
	isSupported: boolean
	isEnabled: boolean
	directoryName: string | null
}

function makeWriteManifest(): (content: string) => Promise<void> {
	return (content: string) => writeFile('_manifest.md', content).then(() => {})
}

function startEngine(engine: SyncEngine) {
	engine.start(createFileOperations(), makeWriteManifest())
}

async function runSync(engine: SyncEngine) {
	await engine.syncNow(createFileOperations(), makeWriteManifest())
}

function useSyncLifecycle(
	engine: SyncEngine,
	isSupported: boolean,
	setUiStatus: Dispatch<SetStateAction<UiStatus>>,
) {
	useEffect(() => {
		if (!isSupported) return

		getStoredDirectoryHandle().then(handle => {
			if (handle) {
				setUiStatus(s => ({
					...s,
					isEnabled: true,
					directoryName: handle.name,
				}))
				startEngine(engine)
			}
		})

		let wasLoggedIn = db.cloud.currentUser.value?.isLoggedIn ?? false
		const subscription = db.cloud.currentUser.subscribe(user => {
			const isLoggedIn = user?.isLoggedIn ?? false
			if (wasLoggedIn && !isLoggedIn) {
				engine.stop()
				clearStoredDirectoryHandle()
				setUiStatus(s => ({
					...s,
					isEnabled: false,
					directoryName: null,
				}))
			}
			wasLoggedIn = isLoggedIn
		})

		return () => {
			subscription.unsubscribe()
			engine.stop()
		}
	}, [engine, isSupported, setUiStatus])
}

export default function useMarkdownExport(): UseMarkdownExportReturn {
	const [engine] = useState(() => createSyncEngine())

	const engineStatus = useObservable(() => engine.status, [engine], {
		isSyncing: false,
		lastSyncAt: null,
		lastSyncResult: null,
		error: null,
	} as SyncEngineStatus)

	const [uiStatus, setUiStatus] = useState<UiStatus>(() => ({
		isSupported: isFileSystemAccessSupported(),
		isEnabled: false,
		directoryName: null,
	}))

	useSyncLifecycle(engine, uiStatus.isSupported, setUiStatus)

	const status: ExportStatus = {
		...uiStatus,
		isSyncing: engineStatus.isSyncing,
		lastSyncAt: engineStatus.lastSyncAt,
		lastSyncResult: engineStatus.lastSyncResult,
		error: engineStatus.error,
	}

	const enable = useCallback(async (): Promise<boolean> => {
		const handle = await requestDirectory()
		if (handle) {
			setUiStatus(s => ({
				...s,
				isEnabled: true,
				directoryName: handle.name,
			}))

			posthog.capture('markdown_export_enabled')
			startEngine(engine)

			return true
		}
		return false
	}, [engine])

	const disable = useCallback(async (): Promise<void> => {
		engine.stop()
		await clearStoredDirectoryHandle()
		setUiStatus(s => ({
			...s,
			isEnabled: false,
			directoryName: null,
		}))
		posthog.capture('markdown_export_disabled')
	}, [engine])

	const syncNow = useCallback(async (): Promise<void> => {
		if (!uiStatus.isEnabled) {
			throw new Error('Export is not enabled')
		}

		await runSync(engine)
	}, [engine, uiStatus.isEnabled])

	const exportOnce = useCallback(async (): Promise<void> => {
		const handle = await requestDirectory()
		if (!handle) {
			throw new Error('No directory selected')
		}

		await runSync(engine)

		const result = engine.status.value.lastSyncResult
		if (result) {
			posthog.capture('markdown_exported', {
				files_created: result.created,
				files_updated: result.updated,
				files_deleted: result.deleted,
				files_failed: result.failed,
			})
		}

		await clearStoredDirectoryHandle()
		setUiStatus(s => ({ ...s, isEnabled: false, directoryName: null }))
	}, [engine])

	return {
		status,
		enable,
		disable,
		syncNow,
		exportOnce,
	}
}
