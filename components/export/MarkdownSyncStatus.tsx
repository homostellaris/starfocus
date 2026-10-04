import { IonIcon } from '@ionic/react'
import { warningSharp, syncSharp, documentTextSharp } from 'ionicons/icons'
import { useOptionalMarkdownExportContext } from './MarkdownExportContext'

import type { ExportStatus } from './useMarkdownExport'

export default function MarkdownSyncStatus({
	exportStatus: overrideExportStatus,
}: {
	exportStatus?: ExportStatus
} = {}) {
	const context = useOptionalMarkdownExportContext()
	const exportStatus = overrideExportStatus !== undefined ? overrideExportStatus : context?.status

	if (!exportStatus) {
		return null
	}

	return (
		<IonIcon
			icon={
				exportStatus.error
					? warningSharp
					: exportStatus.isSyncing
						? syncSharp
						: documentTextSharp
			}
			color={
				exportStatus.error
					? 'warning'
					: exportStatus.isSyncing
						? 'medium'
						: 'default'
			}
			slot="end"
		/>
	)
}
