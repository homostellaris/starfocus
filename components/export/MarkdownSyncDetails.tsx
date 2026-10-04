import {
	IonHeader,
	IonToolbar,
	IonTitle,
	IonContent,
	IonButton,
	IonIcon,
} from '@ionic/react'
import { syncSharp } from 'ionicons/icons'
import { useOptionalMarkdownExportContext } from './MarkdownExportContext'

import type { ExportStatus } from './useMarkdownExport'

export default function MarkdownSyncDetails({
	exportStatus: overrideExportStatus,
	onRunFullSync,
	onReconnect,
}: {
	exportStatus?: ExportStatus
	onRunFullSync?: () => void
	onReconnect?: () => void
} = {}) {
	const context = useOptionalMarkdownExportContext()
	const exportStatus = overrideExportStatus !== undefined ? overrideExportStatus : context?.status
	const runFullSync = onRunFullSync || context?.runFullSync
	const reconnect = onReconnect || context?.reconnect

	if (!exportStatus) {
		return null
	}

	return (
		<>
			<IonHeader>
				<IonToolbar>
					<IonTitle
						className="text-base font-semibold"
						slot="start"
					>
						Local markdown sync
					</IonTitle>
				</IonToolbar>
			</IonHeader>
			<IonContent class="ion-padding">
				<p className="text-sm text-gray-500">{exportStatus.directoryName}</p>
				{exportStatus.needsReconnect ? (
					<div className="mt-4 rounded-lg border border-amber-800/40 bg-amber-950/30 p-3">
						<p className="text-sm font-medium text-amber-400">Folder reconnect needed</p>
						<p className="mt-1 text-xs text-neutral-400">
							Permission to access the markdown export folder has expired.
						</p>
						<IonButton
							expand="block"
							fill="outline"
							color="warning"
							size="small"
							className="mt-3"
							onClick={reconnect}
						>
							Reconnect Folder
						</IonButton>
					</div>
				) : (
					<>
						<p className="text-sm">
							{exportStatus.fullSync.phase === 'in-progress' &&
							exportStatus.fullSync.progress
								? `${exportStatus.fullSync.progress.completed} of ${exportStatus.fullSync.progress.total} files synced`
								: `${exportStatus.totalFiles ?? 0} files synced`}
							{exportStatus.lastSyncAt &&
								` \u00b7 ${exportStatus.lastSyncAt.toLocaleTimeString()}`}
						</p>
						{exportStatus.isSyncing &&
							exportStatus.fullSync.phase !== 'in-progress' && (
								<p className="text-sm">Syncing...</p>
							)}
						{exportStatus.error && (
							<p className="text-sm text-red-500">{exportStatus.error}</p>
						)}
						{exportStatus.fullSync.phase !== 'in-progress' && (
							<IonButton
								expand="block"
								fill="outline"
								size="small"
								className="mt-2"
								onClick={runFullSync}
								disabled={exportStatus.needsReconnect}
							>
								<IonIcon
									icon={syncSharp}
									slot="start"
								/>
								Full Sync
							</IonButton>
						)}
					</>
				)}
			</IonContent>
		</>
	)
}
