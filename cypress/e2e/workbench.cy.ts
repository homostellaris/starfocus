describe('workbench', () => {
	beforeEach(() => {
		cy.viewport(1280, 800)
	})

	it('loads component workbench without errors', () => {
		cy.visit('/dev/components/sync-status')
		cy.get('ion-toolbar', { timeout: 15000 }).should('be.visible')
		cy.get('#workbench-main h1', { timeout: 15000 }).contains('Unified Sync Status Popover').should('be.visible')
		cy.get('[data-testid="workbench-canvas"]').should('be.visible')
		cy.get('[data-testid="workbench-controls-sheet"]').should('exist')
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

		// Momentum Sync Icon
		cy.visit('/dev/components/sync-icon')
		cy.contains('#workbench-main h1', 'Momentum & Inertia Sync Icon', { timeout: 15000 }).should('be.visible')

		// Momentum Settings Cog
		cy.visit('/dev/components/settings-icon')
		cy.contains('#workbench-main h1', 'Momentum & Inertia Settings Cog', { timeout: 15000 }).should('be.visible')

		// Curious Beacon Help Icon
		cy.visit('/dev/components/help-icon')
		cy.contains('#workbench-main h1', 'Curious Beacon Help Icon', { timeout: 15000 }).should('be.visible')

		// Back to Sync Status
		cy.visit('/dev/components/sync-status')
		cy.contains('#workbench-main h1', 'Unified Sync Status Popover', { timeout: 15000 }).should('be.visible')
	})

	it('applies quick presets and updates knobs', () => {
		cy.visit('/dev/components/sync-status')
		cy.contains('Unified Sync Status Popover', { timeout: 15000 }).should('be.visible')

		// Click Cloud Uploading preset
		cy.get('[data-testid="workbench-presets-bar"]').contains('ion-chip', 'Cloud Uploading').click()
		cy.contains('Replication Phase')
		cy.get('#cloud-phase-select').should('have.value', 'pushing')

		// Click Cloud Error preset
		cy.get('[data-testid="workbench-presets-bar"]').contains('ion-chip', 'Cloud Error').click()
		cy.contains('WebSocket connection closed unexpectedly').scrollIntoView().should('be.visible')

		// Click All Synced preset
		cy.get('[data-testid="workbench-presets-bar"]').contains('ion-chip', 'All Synced').click()
		cy.get('#workbench-sync-status-btn').click()
		cy.get('ion-popover').should('be.visible').and('contain.text', 'Cloud database sync')
		cy.get('ion-popover').then(($el) => {
			;($el[0] as any).dismiss?.()
		})
	})

	it('opens the sync status popover from header button and displays dedicated incremental and full sync rows', () => {
		cy.visit('/dev/components/sync-status')
		cy.contains('Unified Sync Status Popover', { timeout: 15000 }).should('be.visible')
		cy.get('#workbench-sync-status-btn').click()
		cy.get('[data-testid="sync-status-popover"]')
			.should('be.visible')
			.and('contain.text', 'Cloud database sync')
			.and('contain.text', 'Local markdown sync')
		// Subheadings have static icons indicating sync type
		cy.get('[data-testid="sync-status-popover"] [data-testid="cloud-sync-icon"]').should('exist')
		cy.get('[data-testid="sync-status-popover"] [data-testid="markdown-sync-icon"]').should('exist')

		// Row 1: Incremental sync
		cy.get('[data-testid="sync-status-popover"] [data-testid="incremental-sync-row"]')
			.should('be.visible')
			.and('contain.text', 'Incremental sync')

		// Row 2: Full sync with action button inside
		cy.get('[data-testid="sync-status-popover"] [data-testid="full-sync-row"]')
			.should('be.visible')
			.and('contain.text', 'Full sync')
		cy.get('[data-testid="sync-status-popover"] [data-testid="full-sync-btn"]')
			.should('be.visible')
			.and('contain.text', 'Full Sync')
		// Click the Full Sync button inside the popover
		cy.get('[data-testid="sync-status-popover"] [data-testid="full-sync-btn"]').click()

		// Verify full sync row is running and button is now hidden
		cy.get('[data-testid="sync-status-popover"] [data-testid="full-sync-row"]')
			.should('be.visible')
			.and('contain.text', 'Full sync')
		cy.get('[data-testid="sync-status-popover"] [data-testid="full-sync-btn"]').should('not.exist')
		// Dismiss popover
		cy.get('[data-testid="sync-status-popover"]').then(($el) => {
			;($el[0] as any).dismiss?.()
		})
	})

	it('displays a single reconnect message with action button when folder reconnect is needed', () => {
		cy.visit('/dev/components/sync-status')
		cy.contains('Unified Sync Status Popover', { timeout: 15000 }).should('be.visible')

		// Apply Reconnect Needed preset
		cy.get('[data-testid="workbench-presets-bar"]').contains('ion-chip', 'Reconnect Needed').click()

		// Open popover
		cy.get('#workbench-sync-status-btn').click({ force: true })
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

	it('displays a dedicated Sync button when not connected to cloud', () => {
		cy.visit('/dev/components/sync-status')
		cy.contains('Unified Sync Status Popover', { timeout: 15000 }).should('be.visible')

		// Apply Signed Out preset
		cy.get('[data-testid="workbench-presets-bar"]').contains('ion-chip', 'Signed Out').click()

		// Open popover
		cy.get('#workbench-sync-status-btn').click({ force: true })
		cy.get('ion-popover').should('be.visible')

		// Disconnected cloud row and Sync login button should be visible
		cy.get('ion-popover [data-testid="cloud-disconnected-row"]')
			.should('be.visible')
			.and('contain.text', 'Not connected to cloud')
		cy.get('ion-popover [data-testid="cloud-login-btn"]')
			.should('be.visible')
			.and('contain.text', 'Sync')

		// Click the Sync button to simulate sign in
		cy.get('ion-popover [data-testid="cloud-login-btn"]').click()

		// Disconnected row should no longer be visible once signed in
		cy.get('ion-popover [data-testid="cloud-disconnected-row"]').should('not.exist')
		cy.get('ion-popover [data-testid="cloud-sync-row"]').should('be.visible')

		// Dismiss popover
		cy.get('ion-popover').then(($el) => {
			;($el[0] as any).dismiss?.()
		})
	})

	it('displays a dedicated Set Up button when markdown export is disabled', () => {
		cy.visit('/dev/components/sync-status')
		cy.contains('Unified Sync Status Popover', { timeout: 15000 }).should('be.visible')

		// Expand controls sheet to access markdown export toggle in knobs
		cy.get('[data-testid="workbench-controls-sheet"]').then(($el) => {
			;($el[0] as any).setCurrentBreakpoint(0.65)
		})
		cy.wait(400)
		cy.get('[data-testid="workbench-controls-sheet"]')
			.contains('Export Enabled')
			.parent()
			.find('ion-toggle')
			.click({ force: true })

		// Collapse controls sheet back to peek mode so canvas is clear
		cy.get('[data-testid="workbench-controls-sheet"]').then(($el) => {
			;($el[0] as any).setCurrentBreakpoint(0.08)
		})
		cy.wait(400)

		// Open popover
		cy.get('#workbench-sync-status-btn').click({ force: true })
		cy.get('ion-popover').should('be.visible')

		// Markdown disabled row and Set Up button should be visible
		cy.get('ion-popover [data-testid="markdown-disabled-row"]')
			.should('be.visible')
			.and('contain.text', 'Not enabled')
			.and('contain.text', 'Export tasks to a local folder')
		cy.get('ion-popover [data-testid="markdown-setup-btn"]')
			.should('be.visible')
			.and('contain.text', 'Set Up')

		// Click Set Up button
		cy.get('ion-popover [data-testid="markdown-setup-btn"]').click()

		// Dismiss popover
		cy.get('ion-popover').then(($el) => {
			;($el[0] as any).dismiss?.()
		})
	})

	it('perpetually spins the sync icon whenever syncing activity is occurring', () => {
		cy.visit('/dev/components/sync-status')
		cy.contains('Unified Sync Status Popover', { timeout: 15000 }).should('be.visible')

		// Default state is in-sync (idle) -> not spinning
		cy.get('#workbench-sync-status-btn').should('be.visible')
		cy.get('#workbench-sync-status-btn [data-testid="sync-icon"]')
			.should('exist')
			.and('have.attr', 'data-spinning', 'false')
			.and('not.have.class', 'animate-spin')

		// Apply Cloud Uploading preset -> spinning
		cy.get('[data-testid="workbench-presets-bar"]').contains('ion-chip', 'Cloud Uploading').click()
		cy.get('#workbench-sync-status-btn [data-testid="sync-icon"]')
			.should('have.attr', 'data-spinning', 'true')
			.and('have.class', 'animate-spin')

		// Apply Full MD Sync preset -> spinning
		cy.get('[data-testid="workbench-presets-bar"]').contains('ion-chip', 'Full MD Sync').click()
		cy.get('#workbench-sync-status-btn [data-testid="sync-icon"]')
			.should('have.attr', 'data-spinning', 'true')
			.and('have.class', 'animate-spin')

		// Apply All Synced preset -> stops spinning
		cy.get('[data-testid="workbench-presets-bar"]').contains('ion-chip', 'All Synced').click()
		cy.get('#workbench-sync-status-btn [data-testid="sync-icon"]')
			.should('have.attr', 'data-spinning', 'false')
			.and('not.have.class', 'animate-spin')
	})

	it('displays the momentum & inertia isolated component with presets and simulator knobs', () => {
		cy.visit('/dev/components/sync-icon')
		cy.contains('#workbench-main h1', 'Momentum & Inertia Sync Icon', { timeout: 15000 }).should('be.visible')
		cy.get('[data-testid="workbench-canvas"]').should('be.visible')
		cy.get('[data-testid="sync-icon"]').should('be.visible')

		// Click Quick Pulse trigger from presets bar
		cy.get('[data-testid="workbench-presets-bar"]').contains('ion-chip', '150ms Pulse').click()
		cy.get('[data-testid="sync-icon"]').should('have.attr', 'data-spinning', 'true')

		// Expand controls sheet to access simulation triggers and telemetry
		cy.get('[data-testid="workbench-controls-sheet"]').then(($el) => {
			;($el[0] as any).setCurrentBreakpoint(0.65)
		})
		cy.wait(400)
		cy.contains('Simulation Triggers').should('be.visible')
		cy.contains('Active State:').should('be.visible')
	})

	it('provides a sheet modal controls layout with presets in peek mode and expandable knobs', () => {
		cy.viewport(1280, 800)
		cy.visit('/dev/components/sync-status')

		// Main stage with canvas
		cy.get('#workbench-main', { timeout: 15000 }).should('be.visible')
		cy.get('[data-testid="workbench-canvas"]').should('be.visible')

		// Sheet modal is mounted with presets visible in peek mode
		cy.get('[data-testid="workbench-controls-sheet"]').should('exist')
		cy.get('[data-testid="workbench-presets-bar"]').should('be.visible')

		// Expand sheet modal to access simulator knobs
		cy.get('[data-testid="workbench-controls-sheet"]').then(($el) => {
			;($el[0] as any).setCurrentBreakpoint(0.65)
		})
		cy.wait(400)
		cy.get('[data-testid="workbench-controls-sheet"]').contains('Presentation Mode').should('exist')

		// Navigate back to component list using header back button
		cy.get('ion-header ion-back-button').click()
		cy.url().should('include', '/dev/components')
		cy.contains('Component Catalog', { timeout: 15000 }).should('be.visible')
	})

	it('provides a responsive mobile sheet modal experience with peek presets and expandable knobs', () => {
		cy.viewport(390, 844)
		cy.visit('/dev/components/sync-status')
		cy.get('#workbench-main h1', { timeout: 15000 }).contains('Unified Sync Status Popover').should('be.visible')

		cy.get('[data-testid="workbench-controls-sheet"]').should('exist')
		cy.get('[data-testid="workbench-canvas"]').should('be.visible')

		// Verify quick-access presets bar in peek mode
		cy.get('[data-testid="workbench-presets-bar"]').should('be.visible')
		cy.get('[data-testid="workbench-presets-bar"]').contains('ion-chip', 'Cloud Uploading').click()
		cy.get('#workbench-sync-status-btn [data-testid="sync-icon"]').should('have.attr', 'data-spinning', 'true')

		// Expand sheet modal to reveal knobs
		cy.get('[data-testid="workbench-controls-sheet"]').then(($el) => {
			;($el[0] as any).setCurrentBreakpoint(0.65)
		})
		cy.wait(400)
		cy.get('[data-testid="workbench-controls-sheet"]').contains('Presentation Mode').should('exist')

		// Collapse sheet modal back to peek mode
		cy.get('[data-testid="workbench-controls-sheet"]').then(($el) => {
			;($el[0] as any).setCurrentBreakpoint(0.08)
		})

		// Verify component on canvas remains updated
		cy.get('#workbench-sync-status-btn [data-testid="sync-icon"]').should('have.attr', 'data-spinning', 'true')

		// Navigate back to component list using header back button
		cy.get('ion-header ion-back-button').click()
		cy.url().should('include', '/dev/components')
		cy.contains('Component Catalog', { timeout: 15000 }).should('be.visible')
	})

	it('displays the momentum & inertia settings cog with presets and simulator controls', () => {
		cy.visit('/dev/components/settings-icon')
		cy.contains('#workbench-main h1', 'Momentum & Inertia Settings Cog', { timeout: 15000 }).should('be.visible')
		cy.get('[data-testid="workbench-canvas"]').should('be.visible')
		cy.get('[data-testid="settings-icon"]').should('be.visible')

		// Initial state is closed / idle
		cy.get('[data-testid="settings-icon"]')
			.should('have.attr', 'data-spinning', 'false')

		// Click Open Menu preset -> starts spinning
		cy.get('[data-testid="workbench-presets-bar"]', { timeout: 15000 }).contains('ion-chip', 'Open Menu').click()
		cy.get('[data-testid="settings-icon"]').should('have.attr', 'data-spinning', 'true')

		// Click Close Menu preset -> stops impulse and coasts to idle
		cy.get('[data-testid="workbench-presets-bar"]', { timeout: 15000 }).contains('ion-chip', 'Close Menu').click()
		cy.get('[data-testid="settings-icon"]').should('have.attr', 'data-spinning', 'false')
	})

	it('displays the curious beacon help icon with popover animation state toggling', () => {
		cy.visit('/dev/components/help-icon')
		cy.contains('#workbench-main h1', 'Curious Beacon Help Icon', { timeout: 15000 }).should('be.visible')
		cy.get('[data-testid="workbench-canvas"]').should('be.visible')
		cy.get('[data-testid="help-icon"]').should('be.visible')

		// Default state in workbench has popover open (beacon active)
		cy.get('[data-testid="help-icon"]')
			.should('have.attr', 'data-active', 'true')
			.and('have.attr', 'data-animation', 'curious-beacon')
			.and('have.class', 'animate-curious-beacon')

		// Click Close Popover preset -> switches to resting state
		cy.get('[data-testid="workbench-presets-bar"]', { timeout: 15000 }).contains('ion-chip', 'Close Popover').click()
		cy.get('[data-testid="help-icon"]')
			.should('have.attr', 'data-active', 'false')
			.and('have.attr', 'data-animation', 'none')
			.and('not.have.class', 'animate-curious-beacon')

		// Click Open Popover preset -> reactivates curious beacon loop
		cy.get('[data-testid="workbench-presets-bar"]', { timeout: 15000 }).contains('ion-chip', 'Open Popover').click()
		cy.get('[data-testid="help-icon"]')
			.should('have.attr', 'data-active', 'true')
			.and('have.attr', 'data-animation', 'curious-beacon')
	})
})
