import { IonIcon } from '@ionic/react'
import { cloudSharp } from 'ionicons/icons'

export default function CloudSyncStatus({
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
