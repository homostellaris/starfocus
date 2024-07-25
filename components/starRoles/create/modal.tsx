import StarRoleModal from '../RoleModal'

export function CreateStarRoleModal({
	dismiss,
	title,
}: {
	dismiss: (data?: any, role?: string) => void
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
			title={title}
		/>
	)
}
