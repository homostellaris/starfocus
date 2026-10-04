import { IonIcon } from '@ionic/react'
import { documentTextSharp } from 'ionicons/icons'
import type { ExportStatus } from './useMarkdownExport'

export default function MarkdownSyncStatus({
	exportStatus: _exportStatus,
}: {
	exportStatus?: ExportStatus
} = {}) {
	return (
		<IonIcon
			icon={documentTextSharp}
			color="medium"
			slot="end"
			data-testid="markdown-sync-icon"
		/>
	)
}
