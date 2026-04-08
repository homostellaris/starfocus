describe('Onboarding', () => {
	beforeEach(() => {
		cy.clearLocalStorage()
		cy.visit('/')
	})

	it('shows welcome modal to new users', () => {
		cy.contains('Welcome to Starfocus').should('be.visible')
		cy.contains('Get started').should('be.visible')
		cy.contains('Skip').should('be.visible')
	})

	it('does not show onboarding for returning users who completed it', () => {
		cy.window().then(win => {
			win.localStorage.setItem('onboarding-step', 'completed')
		})
		cy.visit('/')
		cy.contains('Welcome to Starfocus').should('not.exist')
	})

	it('skipping the welcome closes onboarding and shows hint in help popover', () => {
		cy.contains('Skip').click()
		cy.contains('Welcome to Starfocus').should('not.exist')
		cy.get('#help-popover').click()
		cy.contains('Start setup guide').should('be.visible')
	})

	it('advances from welcome to star roles step on Constellation page', () => {
		cy.contains('Get started').click()
		cy.url().should('include', '/constellation')
		cy.contains('Create your star roles').should('be.visible')
		cy.contains('Start with one to three roles').should('be.visible')
	})

	it('continues button only appears after a star role is created', () => {
		cy.contains('Get started').click()
		cy.contains('Continue').should('not.exist')

		cy.get('#create-star-role').click({ force: true })
		cy.get('ion-input[label="Title"]').type('Health')
		cy.get('ion-input[label="Icon"]').type('heart')
		cy.get('ion-button').contains('heart').first().click({ force: true })
		cy.get('ion-button[strong="true"]').contains('Confirm').click()

		cy.contains('Continue (1 created)').should('be.visible')
	})

	it('advances from star roles to first todo step on Home page', () => {
		cy.window().then(win => {
			win.localStorage.setItem('onboarding-step', 'star-roles')
		})
		cy.visit('/')
		cy.url().should('include', '/constellation')

		cy.get('#create-star-role').click({ force: true })
		cy.get('ion-input[label="Title"]').type('Health')
		cy.get('ion-input[label="Icon"]').type('heart')
		cy.get('ion-button').contains('heart').first().click({ force: true })
		cy.get('ion-button[strong="true"]').contains('Confirm').click()

		cy.contains('Continue (1 created)').click()
		cy.url().should('include', '/home')
		cy.contains('Create your first task').should('be.visible')
		cy.contains('star points').should('be.visible')
		cy.contains('Asteroid Field').should('be.visible')
		cy.contains('Wayfinder').should('be.visible')
	})

	it('finish button appears after creating a todo and completes onboarding', () => {
		cy.window().then(win => {
			win.localStorage.setItem('onboarding-step', 'first-todo')
		})
		cy.visit('/')
		cy.contains('Finish').should('not.exist')

		cy.get('ion-fab-button[color="success"]').click()
		cy.get('ion-input[label="Title"]').type('Go for a run')
		cy.get('ion-button[strong="true"]').contains('Confirm').click()

		cy.contains('Finish').click()
		cy.contains('Create your first task').should('not.exist')
		cy.window().its('localStorage').invoke('getItem', 'onboarding-step').should('eq', 'completed')
	})

	it('can restart onboarding from help popover', () => {
		cy.window().then(win => {
			win.localStorage.setItem('onboarding-step', 'completed')
		})
		cy.visit('/')
		cy.contains('Welcome to Starfocus').should('not.exist')

		cy.get('#help-popover').click()
		cy.contains('Start setup guide').click()
		cy.contains('Welcome to Starfocus').should('be.visible')
	})
})
