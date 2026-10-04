import { IonIcon } from '@ionic/react'
import { useObservable } from 'dexie-react-hooks'
import {
	cloudDoneSharp,
	cloudDownloadSharp,
	cloudUploadSharp,
	thunderstormSharp,
} from 'ionicons/icons'
import { db } from '../../db'

export default function CloudSyncStatus({
	user: overrideUser,
	syncState: overrideSyncState,
}: {
	user?: any
	syncState?: any
} = {}) {
	const dbUser = useObservable(db.cloud.currentUser)
	const dbSyncState = useObservable(db.cloud.syncState)

	const user = overrideUser !== undefined ? overrideUser : dbUser
	const syncState = overrideSyncState !== undefined ? overrideSyncState : dbSyncState

	if (!user) {
		return 'No user'
	}

	return (
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
			slot="end"
		></IonIcon>
	)
}
