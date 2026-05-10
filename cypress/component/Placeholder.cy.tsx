import React from 'react'
import Placeholder from '../../components/common/Placeholder'

describe('Placeholder', () => {
	it('renders the heading', () => {
		cy.mount(<Placeholder heading="No todos yet" />)
		cy.contains('h2', 'No todos yet').should('be.visible')
	})

	it('renders children', () => {
		cy.mount(
			<Placeholder heading="Empty">Add some todos to get started</Placeholder>,
		)
		cy.contains('p', 'Add some todos to get started').should('be.visible')
	})

	it('applies text-center layout', () => {
		cy.mount(<Placeholder heading="Test" />)
		cy.get('div').should('have.class', 'text-center')
	})
})
