import _ from 'lodash'
import { useMemo } from 'react'
import { StarRole, StarRoleGroup } from '../db'
import { DexieCloudEntity } from 'dexie-cloud-addon/dist/modern/DexieCloudTable'
import { starHalfSharp } from 'ionicons/icons'

export default function useGroupedStarRoles(
	data:
		| [(StarRole & DexieCloudEntity)[], (StarRoleGroup & DexieCloudEntity)[]]
		| undefined,
): Array<StarRoleGroup & { starRoles: StarRole[] }> {
	return useMemo(() => {
		if (data === undefined) return []

		const [starRoles, starRoleGroups] = data
		const noneStarRole: StarRole = {
			id: '',
			icon: {
				type: 'ionicon',
				name: starHalfSharp,
			},
			starRoleGroupId: undefined,
			title: 'No star role',
		}
		const starRolesByGroupId = _.groupBy(
			[noneStarRole, ...starRoles],
			starRole => starRole.starRoleGroupId ?? '',
		) // You actually *can* key by undefined but that's just unnecessarily weird.

		const noneStarRoleGroup = {
			id: '',
			title: 'No star role group',
		}
		return [noneStarRoleGroup, ...starRoleGroups].map(starRoleGroup => ({
			...starRoleGroup,
			starRoles: starRolesByGroupId[starRoleGroup.id] ?? [],
		}))
	}, [data])
}
