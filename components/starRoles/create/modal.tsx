import { ComponentProps } from 'react'
import StarRoleModal from '../StarRoleModal'

export function CreateStarRoleModal({
	...props
}: ComponentProps<typeof StarRoleModal>) {
	return (
		<StarRoleModal
			id="create-star-role-modal"
			{...props}
		/>
	)
}
