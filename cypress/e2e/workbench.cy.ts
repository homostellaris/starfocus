describe('workbench', () => {
	it('loads component workbench without errors', () => {
		cy.visit('/workbench')
		cy.contains('StarFocus Component Workbench', { timeout: 15000 }).should('be.visible')
		cy.contains('Unified Sync Status Popover').should('be.visible')
	})

	it('can switch between components in catalog', () => {
		cy.visit('/workbench')
		cy.contains('StarFocus Component Workbench', { timeout: 15000 }).should('be.visible')
		
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
		cy.contains('StarFocus Component Workbench', { timeout: 15000 }).should('be.visible')

		// Click Cloud Uploading preset
		cy.contains('button', 'Cloud Uploading').click()
		cy.contains('Replication Phase')
		cy.get('#cloud-phase-select').should('have.value', 'pushing')

		// Click Cloud Error preset
		cy.contains('button', 'Cloud Error').click()
		cy.contains('WebSocket connection closed unexpectedly').scrollIntoView().should('be.visible')

		// Click All Synced preset
		cy.contains('button', 'All Synced').click()
		cy.contains('Cloud database sync').scrollIntoView().should('be.visible')
		cy.contains('Synced').should('be.visible')
	})

	it('opens the sync status popover from header button and displays dedicated incremental and full sync rows', () => {
		cy.visit('/workbench')
		cy.contains('StarFocus Component Workbench', { timeout: 15000 }).should('be.visible')
		cy.get('#workbench-sync-status-btn').click()
		cy.get('ion-popover')
			.should('be.visible')
			.and('contain.text', 'Cloud database sync')
			.and('contain.text', 'Local markdown sync')
		// Subheadings have static icons indicating sync type
		cy.get('ion-popover [data-testid="cloud-sync-icon"]').should('exist')
		cy.get('ion-popover [data-testid="markdown-sync-icon"]').should('exist')

		// Row 1: Incremental sync
		cy.get('ion-popover [data-testid="incremental-sync-row"]')
			.should('be.visible')
			.and('contain.text', 'Incremental sync')

		// Row 2: Full sync with action button inside
		cy.get('ion-popover [data-testid="full-sync-row"]')
			.should('be.visible')
			.and('contain.text', 'Full sync')
		cy.get('ion-popover [data-testid="full-sync-btn"]')
			.should('be.visible')
			.and('contain.text', 'Full Sync')
		// Click the Full Sync button inside the popover
		cy.get('ion-popover [data-testid="full-sync-btn"]').click()

		// Verify full sync row is running and button is now hidden
		cy.get('ion-popover [data-testid="full-sync-row"]')
			.should('be.visible')
			.and('contain.text', 'Full sync')
		cy.get('ion-popover [data-testid="full-sync-btn"]').should('not.exist')
		cy.screenshot('sync-popover-full-sync-running')

		// Dismiss popover
		cy.get('ion-popover').then(($el) => {
			;($el[0] as any).dismiss?.()
		})
	})

	it('displays a single reconnect message with action button when folder reconnect is needed', () => {
		cy.visit('/workbench')
		cy.contains('StarFocus Component Workbench', { timeout: 15000 }).should('be.visible')

		// Apply Reconnect Needed preset
		cy.contains('button', 'Reconnect Needed').click()

		// Open popover
		cy.get('#workbench-sync-status-btn').click()
		cy.get('ion-popover').should('be.visible')

		// Single reconnect row should be visible
		cy.get('ion-popover [data-testid="reconnect-row"]')
			.should('be.visible')
			.and('contain.text', 'Folder reconnect needed')
		cy.get('ion-popover [data-testid="reconnect-btn"]')
			.should('be.visible')
			.and('contain.text', 'Reconnect')

		// The usual two rows and error messages should NOT exist
		cy.get('ion-popover [data-testid="incremental-sync-row"]').should('not.exist')
		cy.get('ion-popover [data-testid="full-sync-row"]').should('not.exist')
		cy.screenshot('sync-popover-reconnect-needed')

		// Click reconnect button
		cy.get('ion-popover [data-testid="reconnect-btn"]').click()

		// Reconnect succeeds: single message disappears and the usual rows return
		cy.get('ion-popover [data-testid="reconnect-row"]').should('not.exist')
		cy.get('ion-popover [data-testid="incremental-sync-row"]').should('be.visible')
		cy.get('ion-popover [data-testid="full-sync-row"]').should('be.visible')

		// Dismiss popover
		cy.get('ion-popover').then(($el) => {
			;($el[0] as any).dismiss?.()
		})
	})

	it('perpetually spins the sync icon whenever syncing activity is occurring', () => {
		cy.visit('/workbench')
		cy.contains('StarFocus Component Workbench', { timeout: 15000 }).should('be.visible')

		// Default state is in-sync (idle) -> not spinning
		cy.get('#workbench-sync-status-btn').should('be.visible')
		cy.get('#workbench-sync-status-btn [data-testid="sync-icon"]')
			.should('exist')
			.and('have.attr', 'data-spinning', 'false')
			.and('not.have.class', 'animate-spin')

		// Apply Cloud Uploading preset -> spinning
		cy.contains('button', 'Cloud Uploading').click()
		cy.get('#workbench-sync-status-btn [data-testid="sync-icon"]')
			.should('have.attr', 'data-spinning', 'true')
			.and('have.class', 'animate-spin')
		cy.screenshot('sync-icon-spinning-cloud')

		// Apply Full MD Sync preset -> spinning
		cy.contains('button', '🟣 Full MD Sync').click()
		cy.get('#workbench-sync-status-btn [data-testid="sync-icon"]')
			.should('have.attr', 'data-spinning', 'true')
			.and('have.class', 'animate-spin')
		cy.screenshot('sync-icon-spinning-markdown')

		// Apply All Synced preset -> stops spinning
		cy.contains('button', 'All Synced').click()
		cy.get('#workbench-sync-status-btn [data-testid="sync-icon"]')
			.should('have.attr', 'data-spinning', 'false')
			.and('not.have.class', 'animate-spin')
	})

	it('provides a mobile experience with quick presets and slide-up drawer without obscuring components', () => {
		cy.viewport(390, 844)
		cy.visit('/workbench')
		cy.contains('StarFocus Component Workbench', { timeout: 15000 }).should('be.visible')

		// Component selector is visible on mobile
		cy.get('[data-testid="mobile-component-select"]').should('be.visible')

		// Component under test is visible and not squished
		cy.contains('Unified Sync Status Popover').should('be.visible')
		cy.get('#workbench-sync-status-btn').should('be.visible')

		// Persistent Quick Presets bar is visible above the component
		cy.get('[data-testid="workbench-presets-bar"]').should('be.visible')

		// Switching presets updates component in real-time with zero overlay sheet
		cy.get('[data-testid="workbench-presets-bar"]').contains('button', '🔵 Cloud Uploading').click()
		cy.get('#workbench-sync-status-btn').should('be.visible')
		cy.get('#workbench-sync-status-btn [data-testid="sync-icon"]').should('have.attr', 'data-spinning', 'true')
		cy.screenshot('mobile-presets-bar-in-view')

		// Knobs button in IonFooter respects safe areas and opens fine-grained knobs
		cy.get('#mobile-knobs-toggle-btn').should('be.visible')
		cy.screenshot('mobile-footer-toolbar')

		// Open mobile knobs modal
		cy.get('#mobile-knobs-toggle-btn').click()
		cy.get('#mobile-knobs-drawer').should('be.visible')
		// Knobs drawer only contains fine-grained controls, not duplicated presets
		cy.get('#mobile-knobs-drawer').contains('Cloud Sync Controls').should('be.visible')
		cy.get('#mobile-knobs-drawer [data-testid="workbench-presets-bar"]').should('not.exist')
		cy.screenshot('mobile-drawer-open')

		// Close mobile knobs modal
		cy.get('#mobile-knobs-drawer').contains('ion-button', 'Done').click()
		cy.get('#mobile-knobs-drawer').should('not.be.visible')
	})

})
