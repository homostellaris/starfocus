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
} from '@ionic/react'
import { syncSharp } from 'ionicons/icons'
import CloudSyncStatus from '../db/cloud/CloudSyncStatus'
import MarkdownSyncStatus from '../export/MarkdownSyncStatus'
import { useObservable } from 'dexie-react-hooks'
import { db } from '../db'
import { useOptionalMarkdownExportContext } from '../export/MarkdownExportContext'
import type { ExportStatus } from '../export/useMarkdownExport'

export interface SyncStatusProps {
	id?: string
	syncState?: any
	exportStatus?: ExportStatus
	user?: any
	onRunFullSync?: () => void
	onReconnect?: () => void
	inline?: boolean
}

export default function SyncStatus({
	id = 'sync-status',
	syncState: overrideSyncState,
	exportStatus: overrideExportStatus,
	user: overrideUser,
	onRunFullSync,
	onReconnect,
	inline = false,
}: SyncStatusProps = {}) {
	const dbUser = useObservable(db.cloud.currentUser)
	const dbSyncState = useObservable(db.cloud.syncState)
	const markdownContext = useOptionalMarkdownExportContext()

	const user = overrideUser !== undefined ? overrideUser : dbUser
	const syncState = overrideSyncState !== undefined ? overrideSyncState : dbSyncState
	const exportStatus = overrideExportStatus !== undefined ? overrideExportStatus : markdownContext?.status
	const runFullSync = onRunFullSync || markdownContext?.runFullSync
	const reconnect = onReconnect || markdownContext?.reconnect


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
		if (exportStatus?.fullSync?.phase === 'complete') {
			setFullSyncCompletedAt(new Date())
		}
	}, [exportStatus?.fullSync?.phase])

	const isCloudSyncing =
		syncState?.phase === 'pushing' || syncState?.phase === 'pulling'
	const isIncrementalSyncing =
		Boolean(exportStatus?.isSyncing && exportStatus?.fullSync?.phase !== 'in-progress')
	const isFullSyncing = exportStatus?.fullSync?.phase === 'in-progress'
	const isSyncingActive = Boolean(
		isCloudSyncing || isIncrementalSyncing || isFullSyncing || exportStatus?.isSyncing,
	)

	function formatTime(date: Date) {
		return date.toLocaleTimeString()
	}

	function formatSyncResult() {
		const result = exportStatus?.lastSyncResult
		if (!result) return null
		const parts: Array<string> = []
		if (result.created > 0) parts.push(`${result.created} created`)
		if (result.updated > 0) parts.push(`${result.updated} updated`)
		if (result.deleted > 0) parts.push(`${result.deleted} deleted`)
		return parts.length > 0 ? parts.join(', ') : 'No changes'
	}

	const listContent = (
		<IonList
			className="text-xs !pt-0 !mt-0"
			style={{ paddingTop: 0, marginTop: 0 }}
		>
			<IonItemGroup className="!pt-0 !mt-0">
				<IonItemDivider
					className="!border-t-0 !mt-0"
					style={{ borderTop: 0, marginTop: 0 }}
				>
					<IonLabel>Cloud database sync</IonLabel>
					<CloudSyncStatus
						syncState={syncState}
						user={user}
					/>
				</IonItemDivider>
				{user && syncState?.error && (
					<IonItem>
						<p className="text-xs text-red-500">{syncState.error.message || String(syncState.error)}</p>
					</IonItem>
				)}
				{user && isCloudSyncing && (
					<IonItem>
						<div className="w-full py-1">
							<div className="flex justify-between items-center mb-1 text-xs">
								<span className="font-medium">Cloud sync</span>
								<span className="text-neutral-400">Syncing...</span>
							</div>
							<IonProgressBar value={syncState?.progress ?? undefined} />
						</div>
					</IonItem>
				)}
				{user && !isCloudSyncing && !syncState?.error && (
					<IonItem data-testid="cloud-sync-row">
						<IonLabel>
							<div className="text-xs font-medium">Cloud sync</div>
							<div className="text-xs text-neutral-400 mt-0.5">
								Synced{lastCloudSyncAt ? ` · ${formatTime(lastCloudSyncAt)}` : ' · Up to date'}
							</div>
						</IonLabel>
					</IonItem>
				)}
				{!user && (
					<IonItem>
						<IonLabel>
							<div className="text-xs font-medium text-neutral-400">Not connected to cloud</div>
							<div className="text-xs text-neutral-500 mt-0.5">Sign in to sync across devices</div>
						</IonLabel>
					</IonItem>
				)}
			</IonItemGroup>
			<IonItemGroup>
				<IonItemDivider>
					<IonLabel>Local markdown sync</IonLabel>
					<MarkdownSyncStatus exportStatus={exportStatus} />
				</IonItemDivider>
				{exportStatus?.needsReconnect ? (
					<IonItem data-testid="reconnect-row">
						<IonLabel>
							<div className="text-xs font-medium text-amber-400">Folder reconnect needed</div>
							<div className="text-xs text-neutral-400 mt-0.5">
								{exportStatus.directoryName
									? `Access to ${exportStatus.directoryName} expired`
									: 'Permission required to sync files'}
							</div>
						</IonLabel>
						<IonButton
							slot="end"
							fill="outline"
							size="small"
							color="warning"
							onClick={reconnect}
							className="text-xs"
							data-testid="reconnect-btn"
						>
							Reconnect
						</IonButton>
					</IonItem>
				) : (
					<>
						{exportStatus?.error && (
							<IonItem>
								<p className="text-red-500">{exportStatus.error}</p>
							</IonItem>
						)}
						{exportStatus?.isEnabled ? (
							<>
								{/* Row 1: Incremental sync */}
								<IonItem data-testid="incremental-sync-row">
									{isIncrementalSyncing ? (
										<div className="w-full py-1">
											<div className="flex justify-between items-center mb-1 text-xs">
												<span className="font-medium">Incremental sync</span>
												<span className="text-neutral-400">Syncing...</span>
											</div>
											<IonProgressBar type="indeterminate" />
										</div>
									) : (
										<IonLabel>
											<div className="text-xs font-medium">Incremental sync</div>
											<div className="text-xs text-neutral-400 mt-0.5">
												{exportStatus.lastSyncResult
													? `${formatSyncResult()} · ${formatTime(exportStatus.lastSyncAt || new Date())}`
													: exportStatus.lastSyncAt
														? `Synced · ${formatTime(exportStatus.lastSyncAt)}`
														: 'Synced · Up to date'}
											</div>
										</IonLabel>
									)}
								</IonItem>

								{/* Row 2: Full sync */}
								<IonItem data-testid="full-sync-row">
									{isFullSyncing ? (
										<div className="w-full py-1">
											<div className="flex justify-between items-center mb-1 text-xs">
												<span className="font-medium">Full sync</span>
												<span className="text-neutral-400">
													{exportStatus.fullSync?.progress
														? `${exportStatus.fullSync.progress.completed} of ${exportStatus.fullSync.progress.total} files`
														: 'Syncing...'}
												</span>
											</div>
											<IonProgressBar
												value={
													exportStatus.fullSync?.progress &&
													exportStatus.fullSync.progress.total > 0
														? exportStatus.fullSync.progress.completed /
														  exportStatus.fullSync.progress.total
														: undefined
												}
											/>
										</div>
									) : (
										<>
											<IonLabel>
												<div className="text-xs font-medium">Full sync</div>
												<div className="text-xs text-neutral-400 mt-0.5">
													{exportStatus.fullSync?.phase === 'complete' &&
													fullSyncCompletedAt
														? `Complete · ${formatTime(fullSyncCompletedAt)}`
														: exportStatus.totalFiles !== null &&
														  exportStatus.totalFiles !== undefined
															? `${exportStatus.totalFiles} files`
															: 'All files'}
												</div>
											</IonLabel>
											<IonButton
												slot="end"
												fill="outline"
												size="small"
												onClick={runFullSync}
												disabled={exportStatus.needsReconnect}
												className="text-xs"
												data-testid="full-sync-btn"
											>
												<IonIcon
													icon={syncSharp}
													slot="start"
												/>
												Full Sync
											</IonButton>
										</>
									)}
								</IonItem>
							</>
						) : (
							<IonItem>
								<p className="text-neutral-400">Not enabled</p>
							</IonItem>
						)}
					</>
				)}
			</IonItemGroup>
		</IonList>
	)

	if (inline) {
		return <div className="w-full">{listContent}</div>
	}

	return (
		<IonButton
			id={id}
			aria-label={isSyncingActive ? 'Syncing in progress' : 'Sync status'}
		>
			<IonIcon
				icon={syncSharp}
				slot="icon-only"
				className={isSyncingActive ? 'animate-spin origin-center' : ''}
				data-testid="sync-icon"
				data-spinning={isSyncingActive ? 'true' : 'false'}
			></IonIcon>
			<IonPopover
				trigger={id}
				triggerAction="click"
				style={{ '--width': '300px' } as React.CSSProperties}
			>
				<IonContent
					className="text-xs !p-0"
					style={{ '--padding-top': '0px', '--padding-bottom': '0px' } as React.CSSProperties}
				>
					{listContent}
				</IonContent>
			</IonPopover>
		</IonButton>
	)
}
