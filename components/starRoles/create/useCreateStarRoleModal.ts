import { useIonModal } from '@ionic/react'
import { HookOverlayOptions } from '@ionic/react/dist/types/hooks/HookOverlayOptions'
import { useCallback } from 'react'
import { db } from '../../db'
import { CreateStarRoleModal } from './modal'

export function useCreateStarRoleModal(): [
	({
		onWillDismiss,
	}: {
		onWillDismiss: HookOverlayOptions['onWillDismiss']
	}) => void,
	(data?: any, role?: string) => void,
] {
	const [present, dismiss] = useIonModal(CreateStarRoleModal, {
		dismiss: (data: string, role: string) => dismiss(data, role),
		title: 'Create star role',
	})

	const createStarRole = useCallback(async ({ title }: { title: any }) => {
		db.starRoles.add({ title })
	}, [])

	return [
		({ onWillDismiss }: HookOverlayOptions) => {
			present({
				onWillDismiss: event => {
					if (event.detail.role === 'confirm') {
						const { starRole } = event.detail.data
						createStarRole(starRole)
					}
					onWillDismiss?.(event)
				},
			})
		},
		dismiss,
	]
}
