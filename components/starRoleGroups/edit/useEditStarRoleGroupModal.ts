import { useIonModal } from '@ionic/react'
import posthog from 'posthog-js'
import { useCallback, useRef, useState } from 'react'
import { StarRoleGroup, db } from '../../db'
import { EditStarRoleGroupModal } from './modal'

export function useEditStarRoleGroupModal(): [
	(starRoleGroup: StarRoleGroup) => void,
	(data?: any, role?: string) => void,
] {
	const [starRoleGroup, setStarRoleGroup] = useState<StarRoleGroup | null>(null)
	const titleInput = useRef<HTMLIonInputElement>(null)
	const [present, dismiss] = useIonModal(EditStarRoleGroupModal, {
		dismiss: (data: string, role: string) => dismiss(data, role),
		starRoleGroup: starRoleGroup,
		title: 'Edit star role',
		titleInput,
	})

	const editStarRoleGroup = useCallback(
		async (starRoleGroupId: string, updatedProperties: StarRoleGroup) => {
			await db.starRoleGroups.update(starRoleGroupId, updatedProperties)
		},
		[],
	)

	return [
		(starRoleGroup: StarRoleGroup) => {
			present({
				onDidPresent: _event => {
					titleInput.current?.setFocus()
				},
				onWillPresent: () => {
					setStarRoleGroup(starRoleGroup)
				},
				onWillDismiss: event => {
					if (event.detail.role === 'confirm') {
						editStarRoleGroup(starRoleGroup.id, event.detail.data)
						posthog.capture('star_role_group_edited')
					}
					setStarRoleGroup(null)
				},
			})
		},
		dismiss,
	]
}
