import { useIonModal } from '@ionic/react'
import { useCallback, useState } from 'react'
import { StarRole, db } from '../../db'
import { EditStarRoleModal } from './modal'

export function useEditStarRoleModal(): [
	(starRole: StarRole) => void,
	(data?: any, role?: string) => void,
] {
	const [starRole, setStarRole] = useState<StarRole | null>(null)
	const [present, dismiss] = useIonModal(EditStarRoleModal, {
		dismiss: (data: string, role: string) => dismiss(data, role),
		starRole,
		title: 'Edit star role',
	})

	const editStarRole = useCallback(async (updatedStarRole: StarRole) => {
		await db.starRoles.update(updatedStarRole.id, {
			title: updatedStarRole.title,
		})
	}, [])

	return [
		(starRole: StarRole) => {
			present({
				onWillPresent: () => {
					setStarRole(starRole)
				},
				onWillDismiss: event => {
					const starRole = event.detail.data
					if (event.detail.role === 'confirm') editStarRole(starRole)
					setStarRole(null)
				},
			})
		},
		dismiss,
	]
}
