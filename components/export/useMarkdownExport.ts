import { useObservable } from 'dexie-react-hooks'
import {
	markdownExportService,
	ExportStatus,
} from './markdownExportService'

export type { ExportStatus }

export function useMarkdownExportStatus(): ExportStatus {
	return useObservable(
		() => markdownExportService.status$,
		[],
		markdownExportService.getStatus(),
	)
}

export interface UseMarkdownExportReturn {
	status: ExportStatus
	enable: () => Promise<boolean>
	disable: () => Promise<void>
	syncNow: () => Promise<void>
	exportOnce: () => Promise<void>
	reconnect: () => Promise<void>
	runFullSync: () => Promise<void>
	requestPermissionIfNeeded: () => Promise<void>
}

export function useMarkdownExportActions() {
	return {
		enable: markdownExportService.enable,
		disable: markdownExportService.disable,
		syncNow: markdownExportService.syncNow,
		exportOnce: markdownExportService.exportOnce,
		reconnect: markdownExportService.reconnect,
		runFullSync: markdownExportService.runFullSync,
		requestPermissionIfNeeded: markdownExportService.requestPermissionIfNeeded,
	}
}

export default function useMarkdownExport(): UseMarkdownExportReturn {
	const status = useMarkdownExportStatus()
	return {
		status,
		enable: markdownExportService.enable,
		disable: markdownExportService.disable,
		syncNow: markdownExportService.syncNow,
		exportOnce: markdownExportService.exportOnce,
		reconnect: markdownExportService.reconnect,
		runFullSync: markdownExportService.runFullSync,
		requestPermissionIfNeeded: markdownExportService.requestPermissionIfNeeded,
	}
}
