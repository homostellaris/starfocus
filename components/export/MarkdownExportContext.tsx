import { createContext, useContext, ReactNode } from 'react'
import useMarkdownExport, { UseMarkdownExportReturn } from './useMarkdownExport'

const MarkdownExportContext = createContext<UseMarkdownExportReturn | null>(
	null,
)

export function MarkdownExportProvider({ children }: { children: ReactNode }) {
	const markdownExport = useMarkdownExport()
	return (
		<MarkdownExportContext.Provider value={markdownExport}>
			{children}
		</MarkdownExportContext.Provider>
	)
}

export function useMarkdownExportContext(): UseMarkdownExportReturn {
	const context = useContext(MarkdownExportContext)
	if (!context) {
		throw new Error(
			'useMarkdownExportContext must be used within a MarkdownExportProvider',
		)
	}
	return context
}
