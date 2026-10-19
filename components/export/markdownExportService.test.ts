import { expect, test } from 'bun:test'
import { BehaviorSubject } from 'rxjs'
import {
	MarkdownExportService,
	computeExportStatus,
	UiStatus,
} from './markdownExportService'
import {
	SyncEngine,
	SyncEngineStatus,
	initialSyncEngineStatus,
} from './syncEngine'

function createFakeSyncEngine(
	statusOverride: Partial<SyncEngineStatus> = {},
): SyncEngine {
	const statusSubject = new BehaviorSubject<SyncEngineStatus>({
		...initialSyncEngineStatus,
		...statusOverride,
	})

	return {
		start: () => {},
		stop: () => {},
		syncNow: async () => {},
		runFullSync: async () => {},
		status: statusSubject,
	}
}

test('initial status has expected defaults and non-syncing state', () => {
	const service = new MarkdownExportService(createFakeSyncEngine())
	const initialStatus = service.getStatus()

	expect(initialStatus.isEnabled).toBe(false)
	expect(initialStatus.isSyncing).toBe(false)
	expect(initialStatus.needsReconnect).toBe(false)
	expect(initialStatus.directoryName).toBeNull()
	expect(initialStatus.error).toBeNull()
	expect(initialStatus.lastSyncAt).toBeNull()
	expect(initialStatus.totalFiles).toBeNull()
	expect(initialStatus.fullSync.phase).toBe('idle')
})

test('status$ stream emits current status to subscribers', done => {
	const service = new MarkdownExportService(createFakeSyncEngine())

	let receivedStatus: ReturnType<typeof service.getStatus> | null = null
	const subscription = service.status$.subscribe(status => {
		receivedStatus = status
	})

	expect(receivedStatus).not.toBeNull()
	expect(receivedStatus!.isEnabled).toBe(false)
	expect(receivedStatus!.isSyncing).toBe(false)
	subscription.unsubscribe()
	done()
})

test('computeExportStatus combines UI status and engine status correctly', () => {
	const uiStatus: UiStatus = {
		isSupported: true,
		isEnabled: true,
		needsReconnect: false,
		directoryName: 'Notes',
	}

	const engineStatus: SyncEngineStatus = {
		incremental: {
			isSyncing: true,
			lastSyncAt: new Date(2026, 9, 19),
			lastSyncResult: { created: 2, updated: 1, deleted: 0, failed: 0 },
			error: null,
		},
		full: {
			phase: 'idle',
			progress: null,
			error: null,
		},
		totalFiles: 42,
		lastSyncAt: new Date(2026, 9, 19),
	}

	const computed = computeExportStatus(uiStatus, engineStatus)

	expect(computed.isSupported).toBe(true)
	expect(computed.isEnabled).toBe(true)
	expect(computed.isSyncing).toBe(true)
	expect(computed.directoryName).toBe('Notes')
	expect(computed.totalFiles).toBe(42)
	expect(computed.lastSyncResult).toEqual({ created: 2, updated: 1, deleted: 0, failed: 0 })
})

test('computeExportStatus marks isSyncing when full sync is in progress', () => {
	const uiStatus: UiStatus = {
		isSupported: true,
		isEnabled: true,
		needsReconnect: false,
		directoryName: 'Notes',
	}

	const engineStatus: SyncEngineStatus = {
		...initialSyncEngineStatus,
		full: {
			phase: 'in-progress',
			progress: { completed: 10, total: 50 },
			error: null,
		},
	}

	const computed = computeExportStatus(uiStatus, engineStatus)

	expect(computed.isSyncing).toBe(true)
	expect(computed.fullSync.phase).toBe('in-progress')
	expect(computed.fullSync.progress).toEqual({ completed: 10, total: 50 })
})

test('computeExportStatus combines incremental and full sync errors', () => {
	const uiStatus: UiStatus = {
		isSupported: true,
		isEnabled: true,
		needsReconnect: false,
		directoryName: 'Notes',
	}

	const engineStatus: SyncEngineStatus = {
		incremental: {
			isSyncing: false,
			lastSyncAt: null,
			lastSyncResult: null,
			error: 'Incremental failed',
		},
		full: {
			phase: 'idle',
			progress: null,
			error: 'Full sync failed',
		},
		totalFiles: null,
		lastSyncAt: null,
	}

	const computed = computeExportStatus(uiStatus, engineStatus)

	expect(computed.error).toBe('Incremental failed; Full sync failed')
})

test('disable stops sync and clears enabled status', async () => {
	let stopCalled = false
	const fakeEngine: SyncEngine = {
		...createFakeSyncEngine(),
		stop: () => {
			stopCalled = true
		},
	}

	const service = new MarkdownExportService(fakeEngine)
	await service.disable()

	expect(stopCalled).toBe(true)
	expect(service.getStatus().isEnabled).toBe(false)
	expect(service.getStatus().directoryName).toBeNull()
})

test('requestPermissionIfNeeded does nothing when reconnect is not needed', async () => {
	const service = new MarkdownExportService(createFakeSyncEngine())
	await service.requestPermissionIfNeeded()

	expect(service.getStatus().needsReconnect).toBe(false)
})

test('syncNow rejects when export is not enabled', async () => {
	const service = new MarkdownExportService(createFakeSyncEngine())

	expect(service.syncNow()).rejects.toThrow('Export is not enabled')
})

test('runFullSync rejects when export is not enabled', async () => {
	const service = new MarkdownExportService(createFakeSyncEngine())

	expect(service.runFullSync()).rejects.toThrow('Export is not enabled')
})
