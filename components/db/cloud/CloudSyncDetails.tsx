import {
	IonButton,
	IonButtons,
	IonContent,
	IonHeader,
	IonInput,
	IonItem,
	IonList,
	IonTitle,
	IonToolbar,
} from '@ionic/react'
import { useObservable } from 'dexie-react-hooks'
import { db } from '../../db'

export default function CloudSyncDetails({
	user: overrideUser,
	syncState: overrideSyncState,
	onLogout,
}: {
	user?: any
	syncState?: any
	onLogout?: () => void
} = {}) {
	const dbUser = useObservable(db.cloud.currentUser)
	const dbSyncState = useObservable(db.cloud.syncState)

	const user = overrideUser !== undefined ? overrideUser : dbUser
	const syncState = overrideSyncState !== undefined ? overrideSyncState : dbSyncState

	if (!user) {
		return 'No user'
	}

	return (
		<>
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
								if (onLogout) onLogout()
								else db.cloud.logout()
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
		</>
	)
}
