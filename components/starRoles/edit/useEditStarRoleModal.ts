import { useIonModal } from '@ionic/react'
import { useCallback, useRef, useState } from 'react'
import { StarRole, db } from '../../db'
import { EditStarRoleModal } from './modal'
import { usePostHog } from 'posthog-js/react'

export function useEditStarRoleModal(): [
	(starRole: StarRole) => void,
	(data?: any, role?: string) => void,
] {
	const posthog = usePostHog()
	const [starRole, setStarRole] = useState<StarRole | null>(null)
	const titleInput = useRef<HTMLIonInputElement>(null)
	const [present, dismiss] = useIonModal(EditStarRoleModal, {
		dismiss: (data: string, role: string) => dismiss(data, role),
		starRole,
		title: 'Edit star role',
		titleInput,
	})

	const editStarRole = useCallback(
		async (starRoleId: string, updatedProperties: StarRole) => {
			await db.starRoles.update(starRoleId, updatedProperties)
		},
		[],
	)

	return [
		(starRole: StarRole) => {
			present({
				onDidPresent: _event => {
					titleInput.current?.setFocus()
				},
				onWillPresent: () => {
					setStarRole(starRole)
				},
				onWillDismiss: event => {
					if (event.detail.role === 'confirm') {
						const updatedStarRole = event.detail.data
						editStarRole(starRole.id, updatedStarRole)
						posthog.capture('star_role_edited', {
							changed_icon: updatedStarRole.icon !== starRole.icon,
							changed_group:
								updatedStarRole.starRoleGroup !== starRole.starRoleGroupId,
						})
					}
					setStarRole(null)
				},
			})
		},
		dismiss,
	]
}
