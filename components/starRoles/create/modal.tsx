import { ComponentProps } from 'react'
import StarRoleModal from '../StarRoleModal'

export function CreateStarRoleModal({
	dismiss,
	...props
}: {
	dismiss: (data?: any, role?: string) => void
} & ComponentProps<typeof StarRoleModal>) {
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
			{...props}
		/>
	)
}
