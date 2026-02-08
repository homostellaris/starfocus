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
	cy.visit('/home')
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
