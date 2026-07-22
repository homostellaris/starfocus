import { IonIcon } from '@ionic/react'
import { useObservable } from 'dexie-react-hooks'
import {
	cloudDoneSharp,
	cloudDownloadSharp,
	cloudUploadSharp,
	thunderstormSharp,
} from 'ionicons/icons'
import { db } from '../../db'

export default function CloudSyncStatus() {
	const user = useObservable(db.cloud.currentUser)
	const syncState = useObservable(db.cloud.syncState)

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
