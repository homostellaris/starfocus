describe('onboarding', () => {
	it('can navigate from landing page to app', () => {
		cy.visit('/')
		cy.contains('Try it').click()
		cy.url({ timeout: 30000 }).should('include', '/home')
		cy.get('ion-content', { timeout: 15000 }).should('exist')
	})
})
