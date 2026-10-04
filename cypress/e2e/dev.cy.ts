describe('/dev - Developer Hub', () => {
	it('loads the developer hub with app-bar and navigation cards', () => {
		cy.visit('/dev')

		// App-bar header check (consistent with /home)
		cy.get('ion-toolbar', { timeout: 15000 }).should('be.visible')
		cy.contains('Developer Hub').should('be.visible')

		// Content sections
		cy.contains('Developer Tools & Design System').should('be.visible')
		cy.contains('Component Library').should('be.visible')
		cy.contains('Theme & Tokens').should('be.visible')

		// Links to sub-pages
		cy.contains('a', 'View All Components')
			.should('have.attr', 'href', '/dev/components')
		cy.contains('a', 'Explore Theme Showcase')
			.should('have.attr', 'href', '/dev/theme')

		cy.screenshot('dev-hub')
	})

	it('navigates from /dev to /dev/components', () => {
		cy.visit('/dev')
		cy.get('ion-toolbar', { timeout: 15000 }).should('be.visible')
		cy.contains('a', 'View All Components').click()
		cy.url().should('include', '/dev/components')
		cy.contains('Component Catalog', { timeout: 15000 }).should('be.visible')
	})

	it('navigates from /dev to /dev/theme', () => {
		cy.visit('/dev')
		cy.get('ion-toolbar', { timeout: 15000 }).should('be.visible')
		cy.contains('a', 'Explore Theme Showcase').click()
		cy.url().should('include', '/dev/theme')
		cy.contains('StarFocus Theme & Palettes', { timeout: 15000 }).should('be.visible')
	})
})

