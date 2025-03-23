import { starHalfSharp } from 'ionicons/icons'
import { StarRole } from '../db'

export const noStarRole: StarRole = {
	id: '',
	icon: {
		type: 'ionicon',
		name: starHalfSharp,
	},
	starRoleGroupId: undefined,
	title: 'No star role',
}
