import React from 'react'
import { IonApp } from '@ionic/react'
import { StarRoleIcon } from '../../components/common/StarRoleIcon'
import { StarRole } from '../../components/db'

const fatherRole: StarRole = {
	id: '1',
	title: 'Father',
	icon: { type: 'ionicon', name: 'maleSharp' },
}

describe('StarRoleIcon', () => {
	it('renders with light color when no star role is provided', () => {
		cy.mount(
			<IonApp>
				<StarRoleIcon />
			</IonApp>,
		)
		cy.get('[data-class="star-role-icon"]').should('have.attr', 'color', 'light')
	})

	it('renders with dark color when a star role is provided', () => {
		cy.mount(
			<IonApp>
				<StarRoleIcon starRole={fatherRole} />
			</IonApp>,
		)
		cy.get('[data-class="star-role-icon"]').should('have.attr', 'color', 'dark')
	})

	it('sets data-star-role to the role title', () => {
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
	})

	it('does not set data-star-role when no star role is provided', () => {
		cy.mount(
			<IonApp>
				<StarRoleIcon />
			</IonApp>,
		)
		cy.get('[data-class="star-role-icon"]').should(
			'not.have.attr',
			'data-star-role',
		)
	})
})
