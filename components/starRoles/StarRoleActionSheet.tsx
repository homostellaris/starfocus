import { ActionSheetOptions, useIonActionSheet } from '@ionic/react'
import { HookOverlayOptions } from '@ionic/react/dist/types/hooks/HookOverlayOptions'
import { StarRole, db } from '../db'
import { useEditStarRoleModal } from './edit/useEditStarRoleModal'
import { createSharp, trashSharp } from 'ionicons/icons'

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
						icon: createSharp,
						text: 'Edit',
						data: {
							action: 'edit',
						},
						handler: () => {
							presentEditStarRoleModal(starRole)
						},
					},
					{
						icon: trashSharp,
						text: 'Delete',
						role: 'destructive',
						data: {
							action: 'delete',
						},
						handler: async () => {
							db.transaction('rw', db.starRoles, db.todos, async () => {
								console.debug('deleting', starRole)
								await db.starRoles.delete(starRole.id)
								await db.todos
									.where({ starRole: starRole.id })
									.modify({ starRole: undefined })
								// TODO: Set starRole to undefined on todos with this star role
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
