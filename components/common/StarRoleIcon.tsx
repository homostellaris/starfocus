import { IonIcon } from '@ionic/react'
import { StarRole } from '../db'
import { getIonIcon } from '../starRoles/icons'
import { rocketSharp } from 'ionicons/icons'

export const StarRoleIcon = ({ starRole }: { starRole?: StarRole }) => {
	return (
		<IonIcon
			color={starRole ? 'dark' : 'light'}
			icon={starRole ? getIonIcon(starRole.icon.name) : rocketSharp}
			slot="end"
		/>
	)
}
