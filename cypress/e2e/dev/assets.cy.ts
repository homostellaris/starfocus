it('loads /dev/components/celestial-body and renders all 6 distinct Star Point tiers (1, 2, 3, 5, 8, 13) as raw planets without Next.js runtime errors', () => {
	const consoleErrors: string[] = []
	cy.visit('/dev/components/celestial-body', {
		onBeforeLoad(windowObject) {
			const originalError = windowObject.console.error
			windowObject.console.error = (...argumentsList: unknown[]) => {
				consoleErrors.push(argumentsList.map(String).join(' '))
				originalError.apply(windowObject.console, argumentsList)
			}
		},
	})

	cy.get('ion-toolbar', { timeout: 15000 }).should('be.visible')
	cy.contains('Celestial Body').should('be.visible')

	cy.get('[data-testid="celestial-tier-lineup"]').within(() => {
		cy.get('[data-celestial-class="asteroid"]').should('exist')
		cy.get('[data-celestial-class="dwarf_planet"]').should('exist')
		cy.get('[data-celestial-class="terrestrial"]').should('exist')
		cy.get('[data-celestial-class="gas_giant"]').should('exist')
		cy.get('[data-celestial-class="star"]').should('exist')
		cy.get('[data-celestial-class="black_hole"]').should('exist')
	})

	cy.get('[data-testid="celestial-tier-card-1"]').click()
	cy.get('[data-testid="workbench-celestial-body"] > div')
		.first()
		.find('[data-testid="planet-asset"]')
		.should('have.attr', 'data-celestial-class', 'asteroid')

	cy.get('[data-testid="celestial-tier-card-2"]').click()
	cy.get('[data-testid="workbench-celestial-body"] > div')
		.first()
		.find('[data-testid="planet-asset"]')
		.should('have.attr', 'data-celestial-class', 'dwarf_planet')

	cy.get('[data-testid="celestial-tier-card-3"]').click()
	cy.get('[data-testid="workbench-celestial-body"] > div')
		.first()
		.find('[data-testid="planet-asset"]')
		.should('have.attr', 'data-celestial-class', 'terrestrial')

	cy.get('[data-testid="celestial-tier-card-5"]').click()
	cy.get('[data-testid="workbench-celestial-body"] > div')
		.first()
		.find('[data-testid="planet-asset"]')
		.should('have.attr', 'data-celestial-class', 'gas_giant')

	cy.get('[data-testid="celestial-tier-card-8"]').click()
	cy.get('[data-testid="workbench-celestial-body"] > div')
		.first()
		.find('[data-testid="planet-asset"]')
		.should('have.attr', 'data-celestial-class', 'star')

	cy.get('[data-testid="celestial-tier-card-13"]').click()
	cy.get('[data-testid="workbench-celestial-body"] > div')
		.first()
		.find('[data-testid="planet-asset"]')
		.should('have.attr', 'data-celestial-class', 'black_hole')

	cy.window().then((windowObject) => {
		const portalElement = windowObject.document.querySelector('nextjs-portal')
		const portalText = portalElement?.shadowRoot?.textContent ?? ''
		expect(portalText).not.to.include('Issues')
		expect(consoleErrors).to.deep.equal([])
	})
})

it('loads /dev/components/starship, switches whole starship models and skins, and launches flight mode via slingshot gesture', () => {
	cy.visit('/dev/components/starship')

	cy.get('[data-testid="workbench-starship-showcase"]', {
		timeout: 15000,
	}).should('be.visible')

	cy.get('[data-testid="starship-hull-card-valkyrie_crescent_mk1"]').click()
	cy.get(
		'[data-testid="starship-slingshot-stage"] [data-testid="modular-starship"]',
	).should('have.attr', 'data-hull-archetype', 'valkyrie_crescent_mk1')

	cy.get('[data-testid="starship-slingshot-stage"]')
		.trigger('pointerdown', { clientX: 300, clientY: 250, force: true })
	cy.window().trigger('pointermove', { clientX: 300, clientY: 320, force: true })
	cy.window().trigger('pointerup', { clientX: 300, clientY: 320, force: true })

	cy.get('[data-testid="space-arcade-canvas"]', { timeout: 10000 }).should(
		'be.visible',
	)
})
