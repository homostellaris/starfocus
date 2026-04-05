import {
	IonBackButton,
	IonButton,
	IonButtons,
	IonContent,
	IonHeader,
	IonIcon,
	IonInput,
	IonItem,
	IonLabel,
	IonList,
	IonPopover,
	IonSpinner,
	IonTitle,
	IonToggle,
	IonToolbar,
	useIonModal,
} from '@ionic/react'
import { useObservable } from 'dexie-react-hooks'
import {
	cloudDoneSharp,
	cloudDownloadSharp,
	cloudOfflineSharp,
	cloudUploadSharp,
	documentTextSharp,
	helpCircleSharp,
	syncSharp,
	thunderstormSharp,
	warningSharp,
} from 'ionicons/icons'
import { DisplaySurveyType } from 'posthog-js'
import { usePostHog } from 'posthog-js/react'
import { useMarkdownExportContext } from '../export/MarkdownExportContext'
import { db } from '../db'
import StarPoints from './StarPoints'
import Title from './Title'
import { LoginModal } from '../auth/dexie'
import { useHelp } from './HelpContext'

export const Header = ({ title, backHref }: { title: string; backHref?: string }) => {
	const ui = useObservable(db.cloud.userInteraction)
	const [, dismiss] = useIonModal(LoginModal, {
		dismiss: (data: string, role: string) => dismiss(data, role),
	})

	const user = useObservable(db.cloud.currentUser)
	const isLoggedIn = user?.isLoggedIn
	const syncState = useObservable(db.cloud.syncState)

	const { status: exportStatus, runFullSync } = useMarkdownExportContext()
	const posthog = usePostHog()
	const { helpEnabled, toggleHelp } = useHelp()

	return (
		<>
			<LoginModal ui={ui} />
			<IonHeader>
				<IonToolbar>
					<div
						className="ml-1"
						slot="start"
					>
						{backHref ? (
							<IonButtons>
								<IonBackButton defaultHref={backHref} />
							</IonButtons>
						) : (
							<StarPoints />
						)}
					</div>
					<Title
						className="font-display [font-palette:--redshift] text-3xl"
						slot="start"
					>
						{title}
					</Title>
					<IonButtons
						className="mx-2"
						slot="end"
					>
						<IonButton id="help-popover">
							<IonIcon
								icon={helpCircleSharp}
								slot="icon-only"
							/>
						</IonButton>
						<IonPopover
							trigger="help-popover"
							triggerAction="click"
						>
							<IonContent class="ion-padding">
								<IonItem lines="none">
									<IonLabel>Help hints</IonLabel>
									<IonToggle
										aria-label="Toggle help"
										checked={helpEnabled}
										onIonChange={toggleHelp}
									/>
								</IonItem>
								<IonButton
									expand="block"
									fill="clear"
									href="/docs/get-started/quickstart"
								>
									Documentation
								</IonButton>
								{isLoggedIn && (
									<IonButton
										expand="block"
										fill="clear"
										onClick={() => {
											posthog.displaySurvey(
												'019c2fed-d45c-0000-8e90-9ededf867e7c',
												{
													displayType: DisplaySurveyType.Popover,
													ignoreConditions: true,
													ignoreDelay: true,
												},
											)
										}}
									>
										Send feedback
									</IonButton>
								)}
							</IonContent>
						</IonPopover>
						{exportStatus.isEnabled && (
							<>
								<IonButton id="markdown-export-status">
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
										slot="icon-only"
									/>
								</IonButton>
								<IonPopover
									trigger="markdown-export-status"
									triggerAction="click"
								>
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
										<p className="text-sm text-gray-500">
											{exportStatus.directoryName}
										</p>
										<p className="text-sm">
											{exportStatus.fullSync.phase === 'in-progress' && exportStatus.fullSync.progress
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
											<p className="text-sm text-red-500">
												{exportStatus.error}
											</p>
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
								</IonPopover>
							</>
						)}
						{isLoggedIn ? (
							<>
								<IonButton id="sync-status">
									<IonIcon
										icon={
											syncState?.error
												? thunderstormSharp
												: syncState?.phase === 'pushing'
													? cloudUploadSharp
													: syncState?.phase === 'pulling'
														? cloudDownloadSharp
														: cloudDoneSharp
										}
										color={syncState?.error ? 'danger' : 'default'}
										slot="icon-only"
									></IonIcon>
									<IonPopover
										trigger="sync-status"
										triggerAction="click"
									>
										<IonHeader>
											<IonToolbar>
												<IonTitle
													className="text-base font-semibold"
													slot="start"
												>
													Cloud database sync
												</IonTitle>
												<IonButtons slot="end">
													<IonButton
														color="danger"
														fill="solid"
														onClick={() => {
															db.cloud.logout()
														}}
														size="small"
													>
														Unsync
													</IonButton>
												</IonButtons>
											</IonToolbar>
										</IonHeader>
										<IonContent className="text-xs">
											{syncState?.error ? (
												<p>Sync error: ${syncState.error.message}</p>
											) : (
												<IonList>
													<IonItem>
														<IonInput
															label="Email"
															labelPlacement="floating"
															readonly
															value={user.email}
														></IonInput>
													</IonItem>

													<IonItem>
														<IonInput
															label="License"
															labelPlacement="floating"
															readonly
															value={syncState?.license}
														></IonInput>
													</IonItem>

													<IonItem>
														<IonInput
															label="Status"
															labelPlacement="floating"
															readonly
															value={syncState?.status}
														></IonInput>
													</IonItem>

													<IonItem>
														<IonInput
															label="Phase"
															labelPlacement="floating"
															readonly
															value={syncState?.phase}
														></IonInput>
													</IonItem>

													<IonItem>
														<IonInput
															label="Progress"
															labelPlacement="floating"
															readonly
															value={syncState?.progress || '-'}
														></IonInput>
													</IonItem>
												</IonList>
											)}
										</IonContent>
									</IonPopover>
								</IonButton>
							</>
						) : (
							<>
								<IonButton id="sync-status">
									<IonIcon
										icon={cloudOfflineSharp}
										slot="icon-only"
									></IonIcon>
									<IonPopover
										trigger="sync-status"
										triggerAction="click"
									>
										<IonHeader>
											<IonToolbar>
												<IonTitle
													className="text-base font-semibold"
													slot="start"
												>
													Cloud database sync
												</IonTitle>
											</IonToolbar>
										</IonHeader>
										<IonContent class="ion-padding">
											Not synced. Your data is stored locally only.
										</IonContent>
									</IonPopover>
								</IonButton>
								<IonButton
									color="primary"
									fill="solid"
									onClick={() => {
										db.cloud.login()
									}}
								>
									Sync
								</IonButton>
							</>
						)}
					</IonButtons>
				</IonToolbar>
			</IonHeader>

		</>
	)
}
