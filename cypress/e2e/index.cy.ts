describe('onboarding', () => {
	it('can navigate from landing page to app', () => {
		cy.visit('/')
		cy.contains('Try it').click()
		cy.get('ion-content').should('exist')
	})
})
