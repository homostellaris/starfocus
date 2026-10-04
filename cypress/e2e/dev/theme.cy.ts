describe('/dev/theme - Theme Showcase', () => {
	it('loads theme showcase with colors, swatches and typography', () => {
		cy.visit('/dev/theme')

		// App-bar header
		cy.get('ion-toolbar', { timeout: 15000 }).should('be.visible')
		cy.contains('Theme').should('be.visible')

		// Sections
		cy.contains('StarFocus Theme & Palettes').should('be.visible')
		cy.contains('Star Point Progression Hierarchy').should('exist')
		cy.contains('Ionic Theme Semantic Colors').should('exist')
		cy.contains('Font Palettes & Variations').should('exist')
		cy.contains('Typography System').should('exist')

		// Check Fibonacci Star Point tokens
		cy.contains('1 Star Point').should('exist')
		cy.contains('13 Star Points').should('exist')
		cy.contains('#ff7878').should('exist')
		cy.contains('#9a7bf7').should('exist')

		// Check Semantic colors
		cy.contains('Primary (Blue 400)').should('exist')
		cy.contains('Success (Emerald 400)').should('exist')
		cy.contains('Danger (Rose 400)').should('exist')

		// Check Honk font palettes
		cy.contains('Redshift (Header Title Default)').should('exist')
		cy.contains('Blue Celestial').should('exist')
		cy.contains('Purple Nebula').should('exist')
		cy.contains('Red Supernova').should('exist')

		cy.screenshot('dev-theme')
	})
})


