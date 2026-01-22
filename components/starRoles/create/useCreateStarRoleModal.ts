import { useIonModal } from '@ionic/react'
import { HookOverlayOptions } from '@ionic/react/dist/types/hooks/HookOverlayOptions'
import { useCallback, useRef } from 'react'
import { db, StarRole } from '../../db'
import { CreateStarRoleModal } from './modal'
import { usePostHog } from 'posthog-js/react'

export function useCreateStarRoleModal(): [
	({
		onWillDismiss,
	}: {
		onWillDismiss: HookOverlayOptions['onWillDismiss']
	}) => void,
	(data?: any, role?: string) => void,
] {
	const posthog = usePostHog()
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
						const starRole = event.detail.data
						createStarRole(starRole)
						posthog.capture('star_role_created', {
							has_icon: !!starRole.icon,
							has_group: !!starRole.group,
						})
					}
					onWillDismiss?.(event)
				},
			})
		},
		dismiss,
	]
}
