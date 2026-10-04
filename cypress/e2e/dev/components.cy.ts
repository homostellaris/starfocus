describe('/dev/components - Component Catalog', () => {
	it('renders catalog of components with links to their workbench', () => {
		cy.visit('/dev/components')

		// App-bar header
		cy.get('ion-toolbar', { timeout: 15000 }).should('be.visible')
		cy.contains('Components').should('be.visible')
		cy.contains('Component Catalog').should('be.visible')

		// Check all listed components
		cy.contains('Unified Sync Status Popover').should('exist')
		cy.contains('Cloud Sync Details & Status').should('exist')
		cy.contains('Markdown Sync Details & Status').should('exist')
		cy.contains('Star Role Icons & Badges').should('exist')
		cy.contains('Star Points Progression').should('exist')

		// Links point to /dev/components/[component]
		cy.get('a[href="/dev/components/sync-status"]').should('exist')
		cy.get('a[href="/dev/components/cloud-sync"]').should('exist')
		cy.get('a[href="/dev/components/markdown-sync"]').should('exist')
		cy.get('a[href="/dev/components/star-roles"]').should('exist')
		cy.get('a[href="/dev/components/star-points"]').should('exist')

		cy.screenshot('dev-components')
	})

	it('navigates to individual component workbench when clicked', () => {
		cy.visit('/dev/components')
		cy.get('ion-toolbar', { timeout: 15000 }).should('be.visible')
		cy.get('a[href="/dev/components/sync-status"]').first().click({ force: true })
		cy.url().should('include', '/dev/components/sync-status')
		cy.contains('Unified Sync Status Popover', { timeout: 15000 }).should('be.visible')
	})
})


