function visitFresh(onboardingStep?: string) {
	cy.visit('/home', {
		onBeforeLoad(win) {
			win.localStorage.clear()
			if (onboardingStep) {
				win.localStorage.setItem('onboarding-step', onboardingStep)
			}
		},
	})
}

describe('Onboarding', () => {
	it('shows welcome modal to new users', () => {
		visitFresh()
		cy.contains('Welcome to Starfocus').should('be.visible')
		cy.contains('Get started').should('be.visible')
		cy.contains('Skip').should('be.visible')
	})

	it('does not show onboarding for returning users who completed it', () => {
		visitFresh('completed')
		cy.get('ion-fab>ion-fab-button').should('be.visible')
		cy.contains('Welcome to Starfocus').should('not.exist')
	})

	it('skipping the welcome closes onboarding', () => {
		visitFresh()
		cy.contains('Skip').click()
		cy.contains('Welcome to Starfocus').should('not.exist')
	})

	it('skipped users can restart onboarding from help popover', () => {
		visitFresh('completed')
		cy.get('ion-fab>ion-fab-button').should('be.visible')
		cy.get('#help-popover').click()
		cy.contains('Start setup guide').should('be.visible')
		cy.contains('Start setup guide').click()
		cy.contains('Welcome to Starfocus').should('be.visible')
	})

	it('advances from welcome to star roles step on Constellation page', () => {
		visitFresh()
		cy.contains('Get started').click()
		cy.url().should('include', '/constellation')
		cy.contains('Create your star roles').should('be.visible')
		cy.contains('Start with one to three roles').should('be.visible')
	})

	it('shows the star roles guidance when resuming mid-onboarding', () => {
		visitFresh('star-roles')
		cy.url().should('include', '/constellation')
		cy.contains('Create your star roles').should('be.visible')
	})

	it('shows the first-todo guidance when resuming at that step', () => {
		visitFresh('first-todo')
		cy.url().should('include', '/home')
		cy.contains('Create your first task').should('be.visible')
		cy.contains('star points').should('be.visible')
		cy.contains('Asteroid Field').should('be.visible')
		cy.contains('Wayfinder').should('be.visible')
	})

	it('skip setup in guidance panel dismisses onboarding', () => {
		visitFresh('star-roles')
		cy.url().should('include', '/constellation')
		cy.contains('Skip setup').click()
		cy.contains('Create your star roles').should('not.exist')
	})
})
