import { IonIcon } from '@ionic/react'
import { StarRole } from '../db'
import { getIonIcon } from '../starRoles/icons'
import { rocketSharp } from 'ionicons/icons'
import { ComponentProps } from 'react'

export const StarRoleIcon = ({
	className,
	starRole,
	...props
}: { starRole?: StarRole } & ComponentProps<typeof IonIcon>) => {
	return (
		<IonIcon
			className={className}
			color={starRole ? 'dark' : 'light'}
			data-class="star-role-icon"
			data-star-role={starRole?.title}
			icon={starRole ? getIonIcon(starRole.icon.name) : rocketSharp}
			{...props}
		/>
	)
}
