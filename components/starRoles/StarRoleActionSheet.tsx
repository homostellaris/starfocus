import { ActionSheetOptions, useIonActionSheet } from '@ionic/react'
import { HookOverlayOptions } from '@ionic/react/dist/types/hooks/HookOverlayOptions'
import { StarRole, db } from '../db'
import { useEditStarRoleModal } from './edit/useEditStarRoleModal'

// TODO: Make this so that todo is never null, action sheet doesn't make sense to be open if its null
export function useStarRoleActionSheet() {
	// Using controller action sheet rather than inline because I was re-inventing what it was doing allowing dynamic options to be passed easily
	const [presentActionSheet, dismissActionSheet] = useIonActionSheet()
	// Using controller modal than inline because the trigger prop doesn't work with an ID on a controller-based action sheet button
	const [presentEditStarRoleModal] = useEditStarRoleModal()

	return [
		(starRole: StarRole, options?: ActionSheetOptions & HookOverlayOptions) => {
			presentActionSheet({
				buttons: [
					...(options?.buttons || []),
					{
						text: 'Edit',
						data: {
							action: 'edit',
						},
						handler: () => {
							presentEditStarRoleModal(starRole)
						},
					},
					{
						text: 'Delete',
						role: 'destructive',
						data: {
							action: 'delete',
						},
						handler: async () => {
							db.transaction('rw', db.lists, db.starRoles, async () => {
								await db.starRoles.delete(starRole.id)
								const starRoles = await db.lists.get('#starRoles')
								if (starRoles!.order.includes(starRole.id)) {
									await db.lists.update('#starRoles', list => {
										list.order = list.order.filter(id => id !== starRole.id)
									})
								}
							})
						},
					},
				],
				header: starRole.title,
			})
		},
		dismissActionSheet,
	]
}
