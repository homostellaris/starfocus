it('loads /dev/components/celestial-body, renders all 6 distinct Star Point tiers (1, 2, 3, 5, 8, 13) matched to Star Points primary hues, and switches whole-app themes without Next.js runtime errors', () => {
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
		cy.get('[data-celestial-class="asteroid"]')
			.should('exist')
			.and('have.attr', 'data-primary-color', '#fb7185')
		cy.get('[data-celestial-class="dwarf_planet"]')
			.should('exist')
			.and('have.attr', 'data-primary-color', '#f472b6')
		cy.get('[data-celestial-class="terrestrial"]')
			.should('exist')
			.and('have.attr', 'data-primary-color', '#e879f9')
		cy.get('[data-celestial-class="gas_giant"]')
			.should('exist')
			.and('have.attr', 'data-primary-color', '#a78bfa')
		cy.get('[data-celestial-class="star"]')
			.should('exist')
			.and('have.attr', 'data-primary-color', '#60a5fa')
		cy.get('[data-celestial-class="black_hole"]')
			.should('exist')
			.and('have.attr', 'data-primary-color', '#38bdf8')
	})

	cy.get('[data-testid="workbench-theme-btn-outrun_synthwave"]').click()
	cy.document()
		.its('documentElement')
		.should('have.attr', 'data-star-theme', 'outrun_synthwave')

	cy.get('[data-testid="celestial-tier-lineup"]').within(() => {
		cy.get('[data-celestial-class="asteroid"]').should(
			'have.attr',
			'data-primary-color',
			'#facc15',
		)
		cy.get('[data-celestial-class="black_hole"]').should(
			'have.attr',
			'data-primary-color',
			'#00f5d4',
		)
	})

	cy.get('[data-testid="workbench-theme-btn-redshift"]').click()

	cy.window().then((windowObject) => {
		const portalElement = windowObject.document.querySelector('nextjs-portal')
		const portalText = portalElement?.shadowRoot?.textContent ?? ''
		expect(portalText).not.to.include('Issues')
		expect(consoleErrors).to.deep.equal([])
	})
})

it('loads /dev/components/starship, switches whole starship models, skins, and app themes, and launches flight mode via slingshot gesture', () => {
	cy.visit('/dev/components/starship')

	cy.get('[data-testid="workbench-starship-showcase"]', {
		timeout: 15000,
	}).should('be.visible')

	cy.get('[data-testid="starship-hull-card-valkyrie_crescent_mk1"]').click()
	cy.get(
		'[data-testid="starship-slingshot-stage"] [data-testid="modular-starship"]',
	).should('have.attr', 'data-hull-archetype', 'valkyrie_crescent_mk1')

	cy.get('[data-testid="starship-theme-btn-stellar_spectrum"]').click()
	cy.get(
		'[data-testid="starship-slingshot-stage"] [data-testid="modular-starship"]',
	).should('have.attr', 'data-star-theme', 'stellar_spectrum')

	cy.get('[data-testid="starship-slingshot-stage"]')
		.trigger('pointerdown', { clientX: 300, clientY: 250, force: true })
	cy.window().trigger('pointermove', { clientX: 300, clientY: 320, force: true })
	cy.window().trigger('pointerup', { clientX: 300, clientY: 320, force: true })

	cy.get('[data-testid="space-arcade-canvas"]', { timeout: 10000 }).should(
		'be.visible',
	)
})
