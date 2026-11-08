import React from 'react'
import { IonApp } from '@ionic/react'
import { StarRoleIcon } from '../../components/common/StarRoleIcon'
import { StarRole } from '../../components/db'

const fatherRole: StarRole = {
	id: '1',
	title: 'Father',
	icon: { type: 'ionicon', name: 'maleSharp' },
}

it('renders with role metadata when a star role is provided', () => {
	cy.mount(
		<IonApp>
			<StarRoleIcon starRole={fatherRole} />
		</IonApp>,
	)
	cy.get('[data-class="star-role-icon"]').should(
		'have.attr',
		'data-star-role',
		'Father',
	)
	cy.get('[data-class="star-role-icon"]').should('not.have.attr', 'color')
})

it('allows explicit color prop overrides', () => {
	cy.mount(
		<IonApp>
			<StarRoleIcon
				color="primary"
				starRole={fatherRole}
			/>
		</IonApp>,
	)
	cy.get('[data-class="star-role-icon"]').should(
		'have.attr',
		'color',
		'primary',
	)
})

it('does not set data-star-role or hardcoded color when no star role is provided', () => {
	cy.mount(
		<IonApp>
			<StarRoleIcon />
		</IonApp>,
	)
	cy.get('[data-class="star-role-icon"]').should(
		'not.have.attr',
		'data-star-role',
	)
	cy.get('[data-class="star-role-icon"]').should('not.have.attr', 'color')
})
