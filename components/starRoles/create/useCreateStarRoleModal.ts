import { useIonModal } from '@ionic/react'
import { HookOverlayOptions } from '@ionic/react/dist/types/hooks/HookOverlayOptions'
import { useCallback, useRef } from 'react'
import { db, StarRole } from '../../db'
import { CreateStarRoleModal } from './modal'

export function useCreateStarRoleModal(): [
	({
		onWillDismiss,
	}: {
		onWillDismiss: HookOverlayOptions['onWillDismiss']
	}) => void,
	(data?: any, role?: string) => void,
] {
	const titleInput = useRef<HTMLIonInputElement>(null)
	const [present, dismiss] = useIonModal(CreateStarRoleModal, {
		dismiss: (data: string, role: string) => dismiss(data, role),
		title: 'Create star role',
		titleInput,
	})
	const createStarRole = useCallback(async (properties: StarRole) => {
		db.starRoles.add(properties)
	}, [])

	return [
		({ onWillDismiss }: HookOverlayOptions) => {
			present({
				onDidPresent: _event => {
					titleInput.current?.setFocus()
				},
				onWillDismiss: event => {
					if (event.detail.role === 'confirm') {
						createStarRole(event.detail.data)
					}
					onWillDismiss?.(event)
				},
			})
		},
		dismiss,
	]
}
