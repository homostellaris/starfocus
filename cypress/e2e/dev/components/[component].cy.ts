describe('/dev/components/[component] - Dynamic Component Workbench', () => {
	it('loads sync-status component workbench directly via route', () => {
		cy.visit('/dev/components/sync-status')

		// App-bar header
		cy.get('ion-toolbar').should('be.visible')
		cy.contains('Workbench').should('be.visible')

		// Active component matches route
		cy.contains('Unified Sync Status Popover').should('be.visible')
		cy.get('#workbench-sync-status-btn').should('be.visible')

		cy.screenshot('dev-workbench-sync-status')
	})

	it('loads cloud-sync component workbench directly via route', () => {
		cy.visit('/dev/components/cloud-sync')

		cy.contains('Cloud Sync Details & Status').should('be.visible')
		cy.contains('Detailed replication metrics and current sync indicators').should('be.visible')
	})

	it('loads markdown-sync component workbench directly via route', () => {
		cy.visit('/dev/components/markdown-sync')

		cy.contains('Markdown Local Sync Details & Status').should('be.visible')
	})

	it('loads star-roles component workbench directly via route', () => {
		cy.visit('/dev/components/star-roles')

		cy.get('ion-toolbar', { timeout: 15000 }).should('be.visible')
		cy.get('h1').contains('Star Role Icons').should('be.visible')
	})

	it('loads star-points component workbench directly via route', () => {
		cy.visit('/dev/components/star-points')

		cy.get('ion-toolbar', { timeout: 15000 }).should('be.visible')
		cy.get('h1').contains('Star Points').should('be.visible')
	})

	it('loads starship-trajectory component workbench directly via route', () => {
		cy.visit('/dev/components/starship-trajectory')

		cy.get('ion-toolbar', { timeout: 15000 }).should('be.visible')
		cy.get('h1').contains('Starship & Trajectory Animation').should('be.visible')
		cy.get('#workbench-starship').should('be.visible')
		cy.screenshot('dev-workbench-starship-trajectory')
	})

	it('loads pulse-graph component workbench directly via route', () => {
		cy.visit('/dev/components/pulse-graph')

		cy.get('ion-toolbar', { timeout: 15000 }).should('be.visible')
		cy.get('h1').contains('Activity Pulse Graph').should('be.visible')
		cy.get('#workbench-pulse-graph').should('be.visible')
		cy.screenshot('dev-workbench-pulse-graph')
	})

	it('loads mood-player component workbench directly via route', () => {
		cy.visit('/dev/components/mood-player')

		cy.get('ion-toolbar', { timeout: 15000 }).should('be.visible')
		cy.get('h1').contains('Mood Soundtrack Player').should('be.visible')
		cy.get('#workbench-mood-player').should('be.visible')
		cy.screenshot('dev-workbench-mood-player')
	})

	it('updates route when switching components from sidebar', () => {
		cy.visit('/dev/components/sync-status')

		cy.get('ion-toolbar', { timeout: 15000 }).should('be.visible')
		cy.contains('button', 'Cloud Sync Details').click()
		cy.url().should('include', '/dev/components/cloud-sync')
		cy.contains('Cloud Sync Details & Status').should('be.visible')
	})
})
