import { ActionSheetOptions, useIonActionSheet } from '@ionic/react'
import { HookOverlayOptions } from '@ionic/react/dist/types/hooks/HookOverlayOptions'
import { StarRoleGroup, db } from '../db'
import { useEditStarRoleGroupModal } from './edit/useEditStarRoleGroupModal'
import { createSharp, trashSharp } from 'ionicons/icons'

// TODO: Make this so that todo is never null, action sheet doesn't make sense to be open if its null
export function useStarRoleGroupActionSheet() {
	// Using controller action sheet rather than inline because I was re-inventing what it was doing allowing dynamic options to be passed easily
	const [presentActionSheet, dismissActionSheet] = useIonActionSheet()
	// Using controller modal than inline because the trigger prop doesn't work with an ID on a controller-based action sheet button
	const [presentEditStarRoleGroupModal] = useEditStarRoleGroupModal()

	return [
		(
			starRoleGroup: StarRoleGroup,
			options?: ActionSheetOptions & HookOverlayOptions,
		) => {
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
							presentEditStarRoleGroupModal(starRoleGroup)
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
							db.transaction(
								'rw',
								db.starRoleGroups,
								db.starRoles,
								async () => {
									await db.starRoleGroups.delete(starRoleGroup.id)
									await db.starRoles
										.where({ starRoleGroupId: starRoleGroup.id })
										.modify({ starRoleGroupId: undefined })
								},
							)
						},
					},
				],
				header: starRoleGroup.title,
			})
		},
		dismissActionSheet,
	]
}
