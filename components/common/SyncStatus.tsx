import { useEffect, useRef, useState } from 'react'
import {
	IonButton,
	IonContent,
	IonIcon,
	IonItem,
	IonItemDivider,
	IonItemGroup,
	IonLabel,
	IonList,
	IonPopover,
	IonProgressBar,
	IonSpinner,
} from '@ionic/react'
import { syncSharp } from 'ionicons/icons'
import CloudSyncStatus from '../db/cloud/CloudSyncStatus'
import MarkdownSyncStatus from '../export/MarkdownSyncStatus'
import { useObservable } from 'dexie-react-hooks'
import { db } from '../db'
import { useMarkdownExportContext } from '../export/MarkdownExportContext'

export default function SyncStatus() {
	const syncState = useObservable(db.cloud.syncState)
	const { status: exportStatus, runFullSync } = useMarkdownExportContext()

	const [lastCloudSyncAt, setLastCloudSyncAt] = useState<Date | null>(null)
	const prevCloudPhaseRef = useRef<string | undefined>(undefined)
	useEffect(() => {
		const current = syncState?.phase
		const wasActive =
			prevCloudPhaseRef.current === 'pushing' ||
			prevCloudPhaseRef.current === 'pulling'
		if (wasActive && current === 'in-sync') {
			setLastCloudSyncAt(new Date())
		}
		prevCloudPhaseRef.current = current
	}, [syncState?.phase])

	const [fullSyncCompletedAt, setFullSyncCompletedAt] = useState<Date | null>(
		null,
	)
	useEffect(() => {
		if (exportStatus.fullSync.phase === 'complete') {
			setFullSyncCompletedAt(new Date())
		}
	}, [exportStatus.fullSync.phase])

	const isCloudSyncing =
		syncState?.phase === 'pushing' || syncState?.phase === 'pulling'
	const isIncrementalSyncing =
		exportStatus.isSyncing && exportStatus.fullSync.phase !== 'in-progress'
	const isFullSyncing = exportStatus.fullSync.phase === 'in-progress'

	function formatTime(date: Date) {
		return date.toLocaleTimeString()
	}

	function formatSyncResult() {
		const result = exportStatus.lastSyncResult
		if (!result) return null
		const parts: Array<string> = []
		if (result.created > 0) parts.push(`${result.created} created`)
		if (result.updated > 0) parts.push(`${result.updated} updated`)
		if (result.deleted > 0) parts.push(`${result.deleted} deleted`)
		return parts.length > 0 ? parts.join(', ') : 'No changes'
	}

	return (
		<IonButton id="sync-status">
			<IonIcon
				icon={syncSharp}
				slot="icon-only"
			></IonIcon>
			<IonPopover
				trigger="sync-status"
				triggerAction="click"
			>
				<IonContent className="text-xs">
					<IonList>
						<IonItemGroup>
							<IonItemDivider>
								<IonLabel>Cloud database sync</IonLabel>
								<CloudSyncStatus />
							</IonItemDivider>
							{syncState?.error && (
								<IonItem>
									<p className="text-red-500">{syncState.error.message}</p>
								</IonItem>
							)}
							{isCloudSyncing && (
								<IonItem>
									<p>Syncing...</p>
									<IonProgressBar value={syncState?.progress} />
								</IonItem>
							)}
							{!isCloudSyncing && lastCloudSyncAt && (
								<IonItem>
									<p>Last synced · {formatTime(lastCloudSyncAt)}</p>
								</IonItem>
							)}
						</IonItemGroup>
						<IonItemGroup>
							<IonItemDivider>
								<IonLabel>Local markdown sync</IonLabel>
								<MarkdownSyncStatus />
							</IonItemDivider>
							{exportStatus.error && (
								<IonItem>
									<p className="text-red-500">{exportStatus.error}</p>
								</IonItem>
							)}
							{isIncrementalSyncing && (
								<IonItem>
									<p>Syncing...</p>
								</IonItem>
							)}
							{!isIncrementalSyncing && exportStatus.lastSyncResult && (
								<IonItem>
									<p>
										{formatSyncResult()} · {formatTime(exportStatus.lastSyncAt!)}
									</p>
								</IonItem>
							)}
							{isFullSyncing && exportStatus.fullSync.progress && (
								<IonItem>
									<p>
										Full sync: {exportStatus.fullSync.progress.completed} of{' '}
										{exportStatus.fullSync.progress.total} files
									</p>
								</IonItem>
							)}
							{exportStatus.fullSync.phase === 'complete' && fullSyncCompletedAt && (
								<IonItem>
									<p>Full sync complete · {formatTime(fullSyncCompletedAt)}</p>
								</IonItem>
							)}
							{exportStatus.isEnabled && (
								<IonItem>
									<IonButton
										expand="block"
										fill="outline"
										size="small"
										onClick={runFullSync}
										disabled={exportStatus.needsReconnect || isFullSyncing}
									>
										{isFullSyncing ? (
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
								</IonItem>
							)}
						</IonItemGroup>
					</IonList>
				</IonContent>
			</IonPopover>
		</IonButton>
	)
}
