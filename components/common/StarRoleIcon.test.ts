import { expect, test } from 'bun:test'
import { rocketSharp } from 'ionicons/icons'
import { StarRoleIcon } from './StarRoleIcon'
import { StarRole } from '../db'
import { getIonIcon } from '../starRoles/icons'

const fatherRole: StarRole = {
	id: 'role-1',
	title: 'Father',
	icon: { type: 'ionicon', name: 'maleSharp' },
}

test('inherits currentColor and sets role metadata when starRole is provided', () => {
	const element = StarRoleIcon({ starRole: fatherRole })

	expect(element.props['data-class']).toBe('star-role-icon')
	expect(element.props['data-star-role']).toBe('Father')
	expect(element.props.icon).toBe(getIonIcon('maleSharp'))
	expect(element.props.color).toBeUndefined()
})

test('allows explicit color prop override when starRole is provided', () => {
	const element = StarRoleIcon({ color: 'primary', starRole: fatherRole })

	expect(element.props.color).toBe('primary')
	expect(element.props['data-star-role']).toBe('Father')
})

test('uses light placeholder color and rocketSharp icon when starRole is omitted', () => {
	const element = StarRoleIcon({})

	expect(element.props['data-class']).toBe('star-role-icon')
	expect(element.props['data-star-role']).toBeUndefined()
	expect(element.props.icon).toBe(rocketSharp)
	expect(element.props.color).toBe('light')
})

test('allows explicit color prop override when starRole is omitted', () => {
	const elementWithMedium = StarRoleIcon({ color: 'medium' })
	expect(elementWithMedium.props.color).toBe('medium')

	const elementWithUndefined = StarRoleIcon({ color: undefined })
	expect(elementWithUndefined.props.color).toBeUndefined()
})
