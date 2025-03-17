import { ComponentProps } from 'react'
import StarRoleGroupModal from '../StarRoleGroupModal'

export function EditStarRoleGroupModal({
	...props
}: ComponentProps<typeof StarRoleGroupModal>) {
	return <StarRoleGroupModal {...props} />
}
