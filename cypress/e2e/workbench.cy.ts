describe('workbench', () => {
	it('loads component workbench without errors', () => {
		cy.visit('/workbench')
		cy.contains('StarFocus Component Workbench').should('be.visible')
		cy.contains('Unified Sync Status Popover').should('be.visible')
	})

	it('can switch between components in catalog', () => {
		cy.visit('/workbench')
		
		// Cloud Sync Details
		cy.contains('button', 'Cloud Sync Details').click()
		cy.contains('Detailed replication metrics and current sync indicators').should('be.visible')

		// Markdown Sync Details
		cy.contains('button', 'Markdown Sync Details').click()
		cy.contains('Markdown Local Sync Details & Status').should('be.visible')

		// Star Role Icons
		cy.contains('button', 'Star Role Icons').click()
		cy.contains('Category and role badge visualizers.').should('be.visible')

		// Star Points
		cy.contains('button', 'Star Points').click()
		cy.contains('Experience and progression score badge.').should('be.visible')

		// Back to Sync Status
		cy.contains('button', 'Sync Status (Unified)').click()
		cy.contains('Unified Sync Status Popover').should('be.visible')
	})

	it('applies quick presets and updates knobs', () => {
		cy.visit('/workbench')

		// Click Cloud Uploading preset
		cy.contains('button', 'Cloud Uploading').click()
		cy.contains('Replication Phase')
		cy.get('#cloud-phase-select').should('have.value', 'pushing')

		// Click Cloud Error preset
		cy.contains('button', 'Cloud Error').click()
		cy.contains('WebSocket connection closed unexpectedly').should('be.visible')

		// Click All Synced preset
		cy.contains('button', 'All Synced').click()
		cy.contains('Cloud database sync').should('be.visible')
	})

	it('opens the sync status popover from header button', () => {
		cy.visit('/workbench')
		cy.get('#workbench-sync-status-btn').click()
		cy.get('ion-popover')
			.should('be.visible')
			.and('contain.text', 'Cloud database sync')
			.and('contain.text', 'Local markdown sync')
	})

	it('provides a mobile experience with quick presets and slide-up drawer without obscuring components', () => {
		cy.viewport(390, 844)
		cy.visit('/workbench')

		// Component selector is visible on mobile
		cy.get('[data-testid="mobile-component-select"]').should('be.visible')

		// Component under test is visible and not squished
		cy.contains('Unified Sync Status Popover').should('be.visible')
		cy.get('#workbench-sync-status-btn').should('be.visible')

		// Quick presets bar is visible at bottom
		cy.contains('button', '🟢 Synced').should('be.visible')
		cy.contains('button', '🔵 Uploading').should('be.visible')

		// Clicking a mobile preset updates state
		cy.contains('button', '🔵 Uploading').click()
		cy.get('#workbench-sync-status-btn').should('be.visible')

		// Open mobile knobs drawer
		cy.get('#mobile-knobs-toggle-btn').click()
		cy.get('#mobile-knobs-drawer').should('be.visible')
		cy.get('#mobile-knobs-drawer').contains('State Simulator & Knobs').should('be.visible')
		cy.screenshot('mobile-drawer-open')

		// Close mobile knobs drawer
		cy.get('#mobile-knobs-drawer').contains('button', 'Done ✕').click()
		cy.get('#mobile-knobs-drawer').should('not.exist')
	})

})
