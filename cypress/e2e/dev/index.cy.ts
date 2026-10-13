describe('/dev - Developer Hub', () => {
	it('loads the developer hub with app-bar and navigation cards', () => {
		cy.visit('/dev')

		// App-bar header check (consistent with /home, without help/sync buttons)
		cy.get('ion-toolbar', { timeout: 15000 }).should('be.visible')
		cy.contains('Developer Hub').should('be.visible')
		cy.get('#help-popover').should('not.exist')

		// Content sections
		cy.contains('Developer Tools & Design System').should('be.visible')
		cy.contains('Component Library').should('be.visible')
		cy.contains('Theme & Tokens').should('be.visible')

		// Links to sub-pages
		cy.contains('View All Components').should('exist')
		cy.get('a[href="/dev/components"]').should('exist')
		cy.contains('Explore Theme Showcase').should('exist')
		cy.get('a[href="/dev/theme"]').should('exist')

		cy.screenshot('dev-hub')
	})

	it('navigates from /dev to /dev/components', () => {
		cy.visit('/dev')
		cy.get('ion-toolbar', { timeout: 15000 }).should('be.visible')
		cy.contains('View All Components').click()
		cy.url().should('include', '/dev/components')
		cy.contains('Component Catalog', { timeout: 15000 }).should('be.visible')
	})

	it('navigates from /dev to /dev/theme', () => {
		cy.visit('/dev')
		cy.get('ion-toolbar', { timeout: 15000 }).should('be.visible')
		cy.contains('Explore Theme Showcase').click()
		cy.url().should('include', '/dev/theme')
		cy.contains('StarFocus Theme & Palettes', { timeout: 15000 }).should('be.visible')
	})
})

