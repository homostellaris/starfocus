describe('workbench', () => {
	it('loads component workbench without errors', () => {
		cy.visit('/workbench')
		cy.get('ion-toolbar', { timeout: 15000 }).should('be.visible')
		cy.get('#workbench-main h1', { timeout: 15000 }).contains('Unified Sync Status Popover').should('be.visible')
		cy.get('[data-testid="workbench-canvas"]').should('be.visible')
		cy.get('ion-split-pane').should('exist')
	})

	it('can switch between components via route', () => {
		// Cloud Sync Details
		cy.visit('/dev/components/cloud-sync')
		cy.contains('Detailed replication metrics and current sync indicators', { timeout: 15000 }).should('be.visible')

		// Markdown Sync Details
		cy.visit('/dev/components/markdown-sync')
		cy.contains('Markdown Local Sync Details & Status', { timeout: 15000 }).should('be.visible')

		// Star Role Icons
		cy.visit('/dev/components/star-roles')
		cy.get('h1', { timeout: 15000 }).contains('Star Role Icons').should('be.visible')

		// Star Points
		cy.visit('/dev/components/star-points')
		cy.get('h1', { timeout: 15000 }).contains('Star Points').should('be.visible')

		// Back to Sync Status
		cy.visit('/workbench')
		cy.get('#workbench-main h1', { timeout: 15000 }).contains('Unified Sync Status Popover').should('be.visible')
	})

	it('applies quick presets and updates knobs', () => {
		cy.visit('/workbench')
		cy.contains('Unified Sync Status Popover', { timeout: 15000 }).should('be.visible')

		// Click Cloud Uploading preset
		cy.get('[data-testid="workbench-presets-bar"]').contains('button', 'Cloud Uploading').click()
		cy.contains('Replication Phase')
		cy.get('#cloud-phase-select').should('have.value', 'pushing')

		// Click Cloud Error preset
		cy.get('[data-testid="workbench-presets-bar"]').contains('button', 'Cloud Error').click()
		cy.contains('WebSocket connection closed unexpectedly').scrollIntoView().should('be.visible')

		// Click All Synced preset
		cy.get('[data-testid="workbench-presets-bar"]').contains('button', 'All Synced').click()
		cy.contains('Cloud database sync').scrollIntoView().should('be.visible')
		cy.contains('Synced').should('be.visible')
	})

	it('opens the sync status popover from header button and displays dedicated incremental and full sync rows', () => {
		cy.visit('/workbench')
		cy.contains('Unified Sync Status Popover', { timeout: 15000 }).should('be.visible')
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
		cy.contains('Unified Sync Status Popover', { timeout: 15000 }).should('be.visible')

		// Apply Reconnect Needed preset
		cy.get('[data-testid="workbench-presets-bar"]').contains('button', 'Reconnect Needed').click()

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
		cy.contains('Unified Sync Status Popover', { timeout: 15000 }).should('be.visible')

		// Default state is in-sync (idle) -> not spinning
		cy.get('#workbench-sync-status-btn').should('be.visible')
		cy.get('#workbench-sync-status-btn [data-testid="sync-icon"]')
			.should('exist')
			.and('have.attr', 'data-spinning', 'false')
			.and('not.have.class', 'animate-spin')

		// Apply Cloud Uploading preset -> spinning
		cy.get('[data-testid="workbench-presets-bar"]').contains('button', 'Cloud Uploading').click()
		cy.get('#workbench-sync-status-btn [data-testid="sync-icon"]')
			.should('have.attr', 'data-spinning', 'true')
			.and('have.class', 'animate-spin')
		cy.screenshot('sync-icon-spinning-cloud')

		// Apply Full MD Sync preset -> spinning
		cy.get('[data-testid="workbench-presets-bar"]').contains('button', '🟣 Full MD Sync').click()
		cy.get('#workbench-sync-status-btn [data-testid="sync-icon"]')
			.should('have.attr', 'data-spinning', 'true')
			.and('have.class', 'animate-spin')
		cy.screenshot('sync-icon-spinning-markdown')

		// Apply All Synced preset -> stops spinning
		cy.get('[data-testid="workbench-presets-bar"]').contains('button', 'All Synced').click()
		cy.get('#workbench-sync-status-btn [data-testid="sync-icon"]')
			.should('have.attr', 'data-spinning', 'false')
			.and('not.have.class', 'animate-spin')
	})

	it('provides a 3-pane desktop split pane layout with catalog, stage, and simulator knobs', () => {
		cy.viewport(1280, 800)
		cy.visit('/workbench')
		cy.get('ion-split-pane', { timeout: 15000 }).should('have.class', 'split-pane-visible')

		// Left: Catalog menu is visible
		cy.get('ion-menu[menu-id="components-menu"]').should('be.visible')
		cy.get('ion-menu[menu-id="components-menu"]').contains('Cloud Sync Details & Status').should('be.visible')

		// Middle: Main stage with canvas & presets
		cy.get('#workbench-main').should('be.visible')
		cy.get('[data-testid="workbench-presets-bar"]').should('be.visible')
		cy.get('[data-testid="workbench-canvas"]').should('be.visible')

		// Right: Knobs menu is visible side-by-side
		cy.get('ion-menu[menu-id="knobs-menu"]').should('be.visible')
		cy.contains('Cloud Sync Controls').should('be.visible')

		// Switch component via Catalog menu without full page reload
		cy.get('ion-menu[menu-id="components-menu"]').contains('button', 'Star Role Icons').click()
		cy.get('h1').contains('Star Role Icons').should('be.visible')
		cy.get('ion-menu[menu-id="knobs-menu"]').contains('Star Role Visualizer').should('be.visible')
		cy.screenshot('desktop-splitpane-workbench')
	})

	it('provides a responsive mobile split pane experience with collapsible menus and instant presets', () => {
		cy.viewport(390, 844)
		cy.visit('/workbench')
		cy.get('#workbench-main h1', { timeout: 15000 }).contains('Unified Sync Status Popover').should('be.visible')

		// On mobile, split pane is collapsed and menu buttons are visible
		cy.get('#components-menu-btn').should('be.visible')
		cy.get('#knobs-menu-btn').should('be.visible')

		// Presets are directly accessible at the top of the canvas
		cy.get('[data-testid="workbench-presets-bar"]').should('be.visible')
		cy.get('[data-testid="workbench-canvas"]').should('be.visible')

		// Advance scenario via quick presets bar
		cy.get('[data-testid="workbench-presets-bar"]').contains('button', 'Cloud Uploading').click()
		cy.get('#workbench-sync-status-btn [data-testid="sync-icon"]').should('have.attr', 'data-spinning', 'true')
		cy.get('[data-testid="canvas-scenario-pill"]').should('contain.text', 'Cloud Uploading')

		// Advance scenario via floating pill controls
		cy.get('[data-testid="canvas-scenario-pill"] button[aria-label="Next scenario"]').click()
		cy.get('[data-testid="canvas-scenario-pill"]').should('contain.text', 'Full MD Sync')
		cy.screenshot('mobile-canvas-scenario-advanced')

		// Open Knobs drawer via mobile menu button
		cy.get('#knobs-menu-btn').click()
		cy.get('ion-menu[menu-id="knobs-menu"]').should('be.visible')
		cy.contains('Cloud Sync Controls').should('be.visible')
		cy.screenshot('mobile-knobs-menu-open')

		// Ionic menu animation must complete before closing
		cy.wait(500)
		cy.get('#close-knobs-btn').click({ force: true })
		cy.get('ion-menu[menu-id="knobs-menu"]').should('not.have.class', 'show-menu')
		cy.contains('Cloud Sync Controls').should('not.be.visible')

		// Open Components Catalog drawer via mobile menu button
		cy.wait(500)
		cy.get('#components-menu-btn').click()
		cy.get('ion-menu[menu-id="components-menu"]').should('have.class', 'show-menu')
		cy.get('ion-menu[menu-id="components-menu"]').contains('Cloud Sync Details & Status').should('be.visible')
		cy.screenshot('mobile-components-menu-open')

		// Select a component from the mobile catalog
		cy.wait(500)
		cy.get('ion-menu[menu-id="components-menu"]').contains('button', 'Cloud Sync Details & Status').click()
		cy.contains('Cloud database sync').should('be.visible')
		cy.screenshot('mobile-component-switched')
	})
})
