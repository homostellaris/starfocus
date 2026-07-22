import {
	IonHeader,
	IonToolbar,
	IonTitle,
	IonContent,
	IonButton,
	IonSpinner,
	IonIcon,
} from '@ionic/react'
import { syncSharp } from 'ionicons/icons'
import { useMarkdownExportContext } from './MarkdownExportContext'

export default function MarkdownSyncDetails() {
	const { status: exportStatus, runFullSync } = useMarkdownExportContext()

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
				<IonButton
					expand="block"
					fill="outline"
					size="small"
					className="mt-2"
					onClick={runFullSync}
					disabled={
						exportStatus.needsReconnect ||
						exportStatus.fullSync.phase === 'in-progress'
					}
				>
					{exportStatus.fullSync.phase === 'in-progress' ? (
						<IonSpinner name="crescent" />
					) : (
						<>
							<IonIcon
								icon={syncSharp}
								slot="start"
							/>
							Full Sync
						</>
					)}
				</IonButton>
			</IonContent>
		</>
	)
}
