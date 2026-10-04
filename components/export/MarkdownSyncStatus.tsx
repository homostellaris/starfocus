import { IonIcon } from '@ionic/react'
import { warningSharp, syncSharp, documentTextSharp } from 'ionicons/icons'
import { useMarkdownExportContext } from './MarkdownExportContext'

import type { ExportStatus } from './useMarkdownExport'

export default function MarkdownSyncStatus({
	exportStatus: overrideExportStatus,
}: {
	exportStatus?: ExportStatus
} = {}) {
	const context = useMarkdownExportContext()
	const exportStatus = overrideExportStatus !== undefined ? overrideExportStatus : context.status

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
