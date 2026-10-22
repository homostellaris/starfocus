import { useEffect, useRef, useState } from 'react'
import { menuController } from '@ionic/core/components'
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
import { cloudSharp, folderSharp, syncSharp } from 'ionicons/icons'
import { useObservable } from 'dexie-react-hooks'
import { db } from '../db'
import {
	useMarkdownExportStatus,
	type ExportStatus,
} from '../export/useMarkdownExport'
import { markdownExportService } from '../export/markdownExportService'
import MomentumSyncIcon, {
	type MomentumGlowColor,
	type MomentumIndicatorStyle,
	type MomentumTelemetry,
} from './MomentumSyncIcon'

export function CloudSyncStatusBadge({
	user: _user,
	syncState: _syncState,
}: {
	user?: any
	syncState?: any
} = {}) {
	return (
		<IonIcon
			icon={cloudSharp}
			color="medium"
			slot="end"
			data-testid="cloud-sync-icon"
		/>
	)
}

export function MarkdownSyncStatusBadge({
	exportStatus: _exportStatus,
}: {
	exportStatus?: ExportStatus
} = {}) {
	return (
		<IonIcon
			icon={folderSharp}
			color="medium"
			slot="end"
			data-testid="markdown-sync-icon"
		/>
	)
}

export interface SyncStatusProps {
	id?: string
	syncState?: any
	exportStatus?: ExportStatus
	user?: any
	onRunFullSync?: () => void
	onReconnect?: () => void
	onLogin?: () => void
	onOpenSettings?: () => void
	inline?: boolean
	indicatorStyle?: MomentumIndicatorStyle
	glowColor?: MomentumGlowColor
	glowIntensity?: number
	enableMomentum?: boolean
	maxVelocity?: number
	accelerationRate?: number
	frictionCoefficient?: number
	minimumImpulseDuration?: number
	onTelemetryChange?: (telemetry: MomentumTelemetry) => void
}

export default function SyncStatus({
	id = 'sync-status',
	syncState: overrideSyncState,
	exportStatus: overrideExportStatus,
	user: overrideUser,
	onRunFullSync,
	onReconnect,
	onLogin,
	onOpenSettings,
	inline = false,
	indicatorStyle = 'none',
	glowColor = 'cyan',
	glowIntensity = 1,
	enableMomentum = true,
	maxVelocity = 540,
	accelerationRate = 960,
	frictionCoefficient = 2.4,
	minimumImpulseDuration = 650,
	onTelemetryChange,
}: SyncStatusProps = {}) {
	const dbUser = useObservable(db.cloud.currentUser)
	const dbSyncState = useObservable(db.cloud.syncState)
	const markdownExportStatus = useMarkdownExportStatus()

	const user = overrideUser !== undefined ? overrideUser : dbUser
	const syncState =
		overrideSyncState !== undefined ? overrideSyncState : dbSyncState
	const exportStatus =
		overrideExportStatus !== undefined
			? overrideExportStatus
			: markdownExportStatus
	const runFullSync =
		onRunFullSync || (() => markdownExportService.runFullSync())
	const reconnect = onReconnect || (() => markdownExportService.reconnect())
	const login = onLogin || (() => db.cloud.login())
	const openSettings =
		onOpenSettings ||
		(() => {
			const popover = document.querySelector(
				'ion-popover[trigger="' + id + '"]',
			) as any
			popover?.dismiss?.()
			menuController.open('end')
		})

	const isConnected = Boolean(user && user.isLoggedIn)

	const [lastCloudSyncAt, setLastCloudSyncAt] = useState<Date | null>(null)
	const prevCloudPhaseRef = useRef<string | undefined>(undefined)
	useEffect(() => {
		const current = syncState?.phase
		const wasActive =
			prevCloudPhaseRef.current === 'pushing' ||
			prevCloudPhaseRef.current === 'pulling'
		prevCloudPhaseRef.current = current
		if (wasActive && current === 'in-sync') {
			const timerId = setTimeout(() => {
				setLastCloudSyncAt(new Date())
			}, 0)
			return () => clearTimeout(timerId)
		}
	}, [syncState?.phase])

	const [fullSyncCompletedAt, setFullSyncCompletedAt] = useState<Date | null>(
		null,
	)
	useEffect(() => {
		if (exportStatus?.fullSync?.phase === 'complete') {
			const timerId = setTimeout(() => {
				setFullSyncCompletedAt(new Date())
			}, 0)
			return () => clearTimeout(timerId)
		}
	}, [exportStatus?.fullSync?.phase])

	const isCloudSyncing =
		isConnected &&
		(syncState?.phase === 'pushing' || syncState?.phase === 'pulling')
	const isIncrementalSyncing = Boolean(
		exportStatus?.isSyncing && exportStatus?.fullSync?.phase !== 'in-progress',
	)
	const isFullSyncing = exportStatus?.fullSync?.phase === 'in-progress'
	const isSyncingActive = Boolean(
		isCloudSyncing ||
			isIncrementalSyncing ||
			isFullSyncing ||
			exportStatus?.isSyncing,
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
					<CloudSyncStatusBadge
						syncState={syncState}
						user={user}
					/>
				</IonItemDivider>
				{isConnected && syncState?.error && (
					<IonItem>
						<p className="text-xs text-red-500">
							{syncState.error.message || String(syncState.error)}
						</p>
					</IonItem>
				)}
				{isConnected && !syncState?.error && (
					<IonItem
						data-testid="cloud-sync-row"
						className="[--min-height:56px]"
					>
						<IonLabel className="my-2">
							<div className="flex items-center justify-between text-xs">
								<span className="font-medium">Cloud sync</span>
								{isCloudSyncing && (
									<span className="text-neutral-400">Syncing...</span>
								)}
							</div>
							<div className="h-5 flex items-center mt-1">
								{isCloudSyncing ? (
									<IonProgressBar
										value={syncState?.progress ?? undefined}
										className="h-1.5 rounded-full w-full"
									/>
								) : (
									<div className="text-xs text-neutral-400 truncate">
										Synced
										{lastCloudSyncAt
											? ` · ${formatTime(lastCloudSyncAt)}`
											: ' · Up to date'}
									</div>
								)}
							</div>
						</IonLabel>
					</IonItem>
				)}
				{!isConnected && (
					<IonItem
						data-testid="cloud-disconnected-row"
						className="[--min-height:56px]"
					>
						<IonLabel className="my-2">
							<div className="text-xs font-medium text-neutral-400">
								Not connected to cloud
							</div>
							<div className="mt-1 text-xs text-neutral-500">
								Sign in to sync across devices
							</div>
						</IonLabel>
						<IonButton
							slot="end"
							fill="solid"
							size="small"
							color="primary"
							onClick={login}
							className="text-xs h-7 my-0"
							data-testid="cloud-login-btn"
						>
							Sync
						</IonButton>
					</IonItem>
				)}
			</IonItemGroup>
			<IonItemGroup>
				<IonItemDivider>
					<IonLabel>Local markdown sync</IonLabel>
					<MarkdownSyncStatusBadge exportStatus={exportStatus} />
				</IonItemDivider>
				{exportStatus?.needsReconnect ? (
					<IonItem
						data-testid="reconnect-row"
						className="[--min-height:56px]"
					>
						<IonLabel className="my-2">
							<div className="text-xs font-medium text-amber-400">
								Folder reconnect needed
							</div>
							<div className="h-5 flex items-center mt-1 text-xs text-neutral-400 truncate">
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
							className="text-xs h-7 my-0"
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
								<IonItem
									data-testid="incremental-sync-row"
									className="[--min-height:56px]"
								>
									<IonLabel className="my-2">
										<div className="flex items-center justify-between text-xs">
											<span className="font-medium">Incremental sync</span>
											{isIncrementalSyncing && (
												<span className="text-neutral-400">Syncing...</span>
											)}
										</div>
										<div className="h-5 flex items-center mt-1">
											{isIncrementalSyncing ? (
												<IonProgressBar
													type="indeterminate"
													className="h-1.5 rounded-full w-full"
												/>
											) : (
												<div className="text-xs text-neutral-400 truncate">
													{exportStatus.lastSyncResult
														? `${formatSyncResult()} · ${formatTime(exportStatus.lastSyncAt || new Date())}`
														: exportStatus.lastSyncAt
															? `Synced · ${formatTime(exportStatus.lastSyncAt)}`
															: 'Synced · Up to date'}
												</div>
											)}
										</div>
									</IonLabel>
								</IonItem>

								{/* Row 2: Full sync */}
								<IonItem
									data-testid="full-sync-row"
									className="[--min-height:56px]"
								>
									<IonLabel className="my-2">
										<div className="flex items-center justify-between text-xs">
											<span className="font-medium">Full sync</span>
											{isFullSyncing && (
												<span className="text-neutral-400">
													{exportStatus.fullSync?.progress
														? `${exportStatus.fullSync.progress.completed} of ${exportStatus.fullSync.progress.total} files`
														: 'Syncing...'}
												</span>
											)}
										</div>
										<div className="h-5 flex items-center mt-1">
											{isFullSyncing ? (
												<IonProgressBar
													value={
														exportStatus.fullSync?.progress &&
														exportStatus.fullSync.progress.total > 0
															? exportStatus.fullSync.progress.completed /
																exportStatus.fullSync.progress.total
															: undefined
													}
													className="h-1.5 rounded-full w-full"
												/>
											) : (
												<div className="text-xs text-neutral-400 truncate">
													{exportStatus.fullSync?.phase === 'complete' &&
													fullSyncCompletedAt
														? `Complete · ${formatTime(fullSyncCompletedAt)}`
														: exportStatus.totalFiles !== null &&
															  exportStatus.totalFiles !== undefined
															? `${exportStatus.totalFiles} files`
															: 'All files'}
												</div>
											)}
										</div>
									</IonLabel>
									{!isFullSyncing && (
										<IonButton
											slot="end"
											fill="outline"
											size="small"
											onClick={runFullSync}
											disabled={exportStatus.needsReconnect}
											className="text-xs h-7 my-0"
											data-testid="full-sync-btn"
										>
											<IonIcon
												icon={syncSharp}
												slot="start"
											/>
											Full Sync
										</IonButton>
									)}
								</IonItem>
							</>
						) : (
							<IonItem
								data-testid="markdown-disabled-row"
								className="[--min-height:56px]"
							>
								<IonLabel className="my-2">
									<div className="text-xs font-medium text-neutral-400">
										Not enabled
									</div>
									<div className="mt-1 text-xs text-neutral-500">
										Export tasks to a local folder
									</div>
								</IonLabel>
								<IonButton
									slot="end"
									fill="solid"
									size="small"
									color="primary"
									onClick={openSettings}
									className="text-xs h-7 my-0"
									data-testid="markdown-setup-btn"
								>
									Set Up
								</IonButton>
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
			<MomentumSyncIcon
				slot="icon-only"
				isSyncing={isSyncingActive}
				indicatorStyle={indicatorStyle}
				glowColor={glowColor}
				glowIntensity={glowIntensity}
				enablePhysics={enableMomentum}
				maxVelocity={maxVelocity}
				accelerationRate={accelerationRate}
				frictionCoefficient={frictionCoefficient}
				minimumImpulseDuration={minimumImpulseDuration}
				onTelemetryChange={onTelemetryChange}
			/>
			<IonPopover
				data-testid="sync-status-popover"
				trigger={id}
				triggerAction="click"
				animated={false}
				style={{ '--width': '320px' } as React.CSSProperties}
			>
				<IonContent
					className="text-xs !p-0"
					style={
						{
							'--padding-top': '0px',
							'--padding-bottom': '0px',
						} as React.CSSProperties
					}
				>
					{listContent}
				</IonContent>
			</IonPopover>
		</IonButton>
	)
}
