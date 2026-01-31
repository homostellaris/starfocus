import {
	IonButton,
	IonIcon,
	IonItem,
	IonLabel,
	IonList,
	IonListHeader,
	IonNote,
	IonSpinner,
	IonText,
} from '@ionic/react'
import {
	checkmarkCircleSharp,
	closeCircleSharp,
	cloudOfflineSharp,
	documentTextSharp,
	folderOpenSharp,
	syncSharp,
	warningSharp,
} from 'ionicons/icons'
import useMarkdownExport from './useMarkdownExport'

export default function ExportSettings() {
	const { status, enable, disable, syncNow, exportOnce } = useMarkdownExport()

	if (!status.isSupported) {
		return (
			<IonList>
				<IonListHeader>
					<IonLabel>Markdown Export</IonLabel>
				</IonListHeader>
				<IonItem>
					<IonIcon
						icon={cloudOfflineSharp}
						slot="start"
						color="medium"
					/>
					<IonLabel className="ion-text-wrap">
						<p>
							Your browser does not support the File System Access API required
							for this feature. Please use a Chromium-based browser (Chrome,
							Edge, Brave, etc.) for automatic file sync.
						</p>
					</IonLabel>
				</IonItem>
			</IonList>
		)
	}

	return (
		<IonList>
			<IonListHeader>
				<IonLabel>Markdown Export</IonLabel>
			</IonListHeader>

			{status.isEnabled ? (
				<>
					<IonItem>
						<IonIcon
							icon={folderOpenSharp}
							slot="start"
							color="primary"
						/>
						<IonLabel>
							<h3>Sync Directory</h3>
							<p>{status.directoryName}</p>
						</IonLabel>
						<IonButton
							fill="clear"
							size="small"
							onClick={disable}
						>
							Disconnect
						</IonButton>
					</IonItem>

					<IonItem>
						<IonIcon
							icon={syncSharp}
							slot="start"
							color={status.isSyncing ? 'warning' : 'success'}
						/>
						<IonLabel>
							<h3>Sync Status</h3>
							{status.isSyncing ? (
								<p>Syncing...</p>
							) : status.lastSyncAt ? (
								<p>
									Last synced:{' '}
									{status.lastSyncAt.toLocaleTimeString()}
								</p>
							) : (
								<p>Not synced yet</p>
							)}
						</IonLabel>
						<IonButton
							fill="clear"
							size="small"
							onClick={syncNow}
							disabled={status.isSyncing}
						>
							{status.isSyncing ? (
								<IonSpinner name="crescent" />
							) : (
								'Sync Now'
							)}
						</IonButton>
					</IonItem>

					{status.lastSyncResult && (
						<IonItem>
							<IonIcon
								icon={
									status.lastSyncResult.failed > 0
										? warningSharp
										: checkmarkCircleSharp
								}
								slot="start"
								color={
									status.lastSyncResult.failed > 0
										? 'warning'
										: 'success'
								}
							/>
							<IonLabel>
								<h3>Last Sync Result</h3>
								<p>
									{status.lastSyncResult.written} written
									{status.lastSyncResult.deleted > 0 &&
										`, ${status.lastSyncResult.deleted} deleted`}
									{status.lastSyncResult.failed > 0 &&
										`, ${status.lastSyncResult.failed} failed`}
								</p>
							</IonLabel>
						</IonItem>
					)}

					{status.error && (
						<IonItem color="danger">
							<IonIcon
								icon={closeCircleSharp}
								slot="start"
							/>
							<IonLabel>
								<h3>Error</h3>
								<p>{status.error}</p>
							</IonLabel>
						</IonItem>
					)}
				</>
			) : (
				<>
					<IonItem>
						<IonIcon
							icon={documentTextSharp}
							slot="start"
							color="medium"
						/>
						<IonLabel className="ion-text-wrap">
							<h3>Export to Markdown</h3>
							<p>
								Export your todos as markdown files with metadata in YAML
								front matter. Perfect for use with LLMs, Obsidian, or any
								text-based workflow.
							</p>
						</IonLabel>
					</IonItem>

					<IonItem>
						<IonLabel>
							<IonButton
								expand="block"
								onClick={enable}
							>
								<IonIcon
									icon={syncSharp}
									slot="start"
								/>
								Enable Auto-Sync
							</IonButton>
							<IonNote className="ion-text-wrap ion-padding-top">
								Select a folder to keep markdown files in sync with your
								database. Files will be automatically updated when you make
								changes.
							</IonNote>
						</IonLabel>
					</IonItem>

					<IonItem>
						<IonLabel>
							<IonButton
								expand="block"
								fill="outline"
								onClick={exportOnce}
							>
								<IonIcon
									icon={documentTextSharp}
									slot="start"
								/>
								One-Time Export
							</IonButton>
							<IonNote className="ion-text-wrap ion-padding-top">
								Export all todos once without setting up continuous sync.
							</IonNote>
						</IonLabel>
					</IonItem>
				</>
			)}
		</IonList>
	)
}
