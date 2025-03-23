import _ from 'lodash'
import { useMemo } from 'react'
import { StarRole, StarRoleGroup } from '../db'
import { noStarRoleGroup } from './noStarRoleGroup'

export default function useGroupedStarRoles(
	starRoles: StarRole[],
	starRoleGroups: StarRoleGroup[],
): Array<StarRoleGroup & { starRoles: StarRole[] }> {
	return useMemo(() => {
		const starRolesByGroupId = _.groupBy(
			starRoles,
			starRole => starRole.starRoleGroupId ?? '',
		) // You actually *can* key by undefined but that's just unnecessarily weird.

		return [noStarRoleGroup, ...starRoleGroups].map(starRoleGroup => ({
			...starRoleGroup,
			starRoles: starRolesByGroupId[starRoleGroup.id] ?? [],
		}))
	}, [starRoles, starRoleGroups])
}
