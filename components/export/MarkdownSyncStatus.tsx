import { IonIcon } from '@ionic/react'
import { warningSharp, syncSharp, documentTextSharp } from 'ionicons/icons'
import { useMarkdownExportContext } from './MarkdownExportContext'

export default function MarkdownSyncStatus() {
	const { status: exportStatus } = useMarkdownExportContext()

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
