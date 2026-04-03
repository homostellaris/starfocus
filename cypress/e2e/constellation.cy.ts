beforeEach(() => {
	cy.window().then(win => {
		if (win.db) win.db.close()
		return new Cypress.Promise(resolve => {
			const request = win.indexedDB.deleteDatabase('starfocus-z0vnq74nz')
			request.onsuccess = () => resolve(null)
			request.onerror = () => resolve(null)
			request.onblocked = () => resolve(null)
		})
	})
	cy.visit('/home', {
		onBeforeLoad(win) {
			win.localStorage.setItem('help-enabled', 'true')
		},
	})
	cy.get('ion-fab>ion-fab-button').should('be.visible')
})

it('navigates to constellation page via edit roles button', () => {
	cy.get('#view-menu-button').click()
	cy.get('#view-menu').should('be.visible')
	cy.get('#view-menu').contains('Edit roles').click()
	cy.url().should('include', '/constellation')
	cy.contains('Create some roles to focus on what matters').should('be.visible')
	cy.get('ion-fab>ion-fab-button').should('exist')
})

describe('star role description', () => {
	beforeEach(() => {
		cy.get('#view-menu-button').click()
		cy.get('#view-menu').contains('Edit roles').click()
		cy.url().should('include', '/constellation')
	})

	it('persists description when creating a star role', () => {
		cy.get('ion-fab>ion-fab-button').click()
		cy.get('#create-star-role').click()

		cy.get('ion-input[label="Title"]').find('input').type('Developer')
		cy.get('ion-textarea[label="Description"]')
			.find('textarea')
			.type('Software development and code review tasks')

		// Search for and select an icon
		cy.get('ion-input[label="Icon"]').find('input').type('code')
		cy.get('#icons ion-icon').first().click()

		cy.contains('ion-button', 'Confirm').click()

		cy.db(async db => {
			const starRoles = await db.starRoles.toArray()
			const developer = starRoles.find(sr => sr.title === 'Developer')
			expect(developer?.description).to.equal(
				'Software development and code review tasks',
			)
		})
	})
})
