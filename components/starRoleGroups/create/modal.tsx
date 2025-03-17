import { ComponentProps } from 'react'
import StarRoleModal from '../StarRoleGroupModal'

export function CreateStarRoleGroupModal({
	...props
}: ComponentProps<typeof StarRoleModal>) {
	return <StarRoleModal {...props} />
}
