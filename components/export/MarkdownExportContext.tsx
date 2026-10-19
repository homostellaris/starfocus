import { ReactNode } from 'react'
import { markdownExportService } from './markdownExportService'
import { UseMarkdownExportReturn } from './useMarkdownExport'

export function MarkdownExportProvider({ children }: { children: ReactNode }) {
	return <>{children}</>
}

export function useOptionalMarkdownExportContext(): UseMarkdownExportReturn | null {
	return {
		status: markdownExportService.getStatus(),
		enable: markdownExportService.enable,
		disable: markdownExportService.disable,
		syncNow: markdownExportService.syncNow,
		exportOnce: markdownExportService.exportOnce,
		reconnect: markdownExportService.reconnect,
		runFullSync: markdownExportService.runFullSync,
		requestPermissionIfNeeded: markdownExportService.requestPermissionIfNeeded,
	}
}

export function useMarkdownExportContext(): UseMarkdownExportReturn {
	return useOptionalMarkdownExportContext()!
}
