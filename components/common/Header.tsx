import {
	IonButton,
	IonButtons,
	IonContent,
	IonHeader,
	IonIcon,
	IonImg,
	IonInput,
	IonItem,
	IonLabel,
	IonList,
	IonPopover,
	IonTitle,
	IonToolbar,
	useIonModal,
} from '@ionic/react'
import { useObservable } from 'dexie-react-hooks'
import {
	cloudDoneSharp,
	cloudDownloadSharp,
	cloudOfflineSharp,
	cloudUploadSharp,
	thunderstormSharp,
} from 'ionicons/icons'
import { db } from '../db'
import StarPoints from './StarPoints'
import Title from './Title'
import { LoginModal } from '../auth/dexie'

export const Header = ({ title }: { title: string }) => {
	const ui = useObservable(db.cloud.userInteraction)
	const [present, dismiss] = useIonModal(LoginModal, {
		dismiss: (data: string, role: string) => dismiss(data, role),
	})

	const user = useObservable(db.cloud.currentUser)
	const isLoggedIn = user?.isLoggedIn
	const syncState = useObservable(db.cloud.syncState)

	return (
		<>
			<LoginModal ui={ui} />
			<IonHeader>
				<IonToolbar>
					<div
						className="ml-1"
						slot="start"
					>
						<StarPoints />
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
													className="text-xl font-bold capitalize"
													slot="start"
												>
													{syncState?.status}
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
