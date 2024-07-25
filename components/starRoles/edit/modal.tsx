import { StarRole } from '../../db'
import StarRoleModal from '../RoleModal'

export function EditStarRoleModal({
	dismiss,
	starRole,
	title,
}: {
	dismiss: (data?: any, role?: string) => void
	starRole: StarRole
	title: string
}) {
	return (
		<StarRoleModal
			dismiss={(data?: any, role?: string) => {
				dismiss(
					{
						starRole: data,
					},
					role,
				)
			}}
			starRole={starRole}
			title={title}
		/>
	)
}
