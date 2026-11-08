it('loads /dev/assets and renders all 4 celestial classes and 4 biome palettes across test todos', () => {
	cy.visit('/dev/assets')

	cy.get('ion-toolbar', { timeout: 15000 }).should('be.visible')
	cy.contains('Procedural Visual Assets').should('be.visible')

	cy.get('[data-testid="test-todo-matrix"]').within(() => {
		cy.get('[data-testid="planet-asset"]').should('have.length.at.least', 8)
		cy.get('[data-celestial-class="asteroid"]').should('exist')
		cy.get('[data-celestial-class="terrestrial"]').should('exist')
		cy.get('[data-celestial-class="emissive"]').should('exist')
		cy.get('[data-celestial-class="gas_giant"]').should('exist')

		cy.get('[data-biome-id="engineering"]').should('exist')
		cy.get('[data-biome-id="urgent"]').should('exist')
		cy.get('[data-biome-id="growth"]').should('exist')
		cy.get('[data-biome-id="strategy"]').should('exist')
	})
})

it('updates custom todo planet class, biome, and HUD reticle mode live in the generator lab', () => {
	cy.visit('/dev/assets')
	cy.get('[data-testid="custom-todo-lab"]', { timeout: 15000 }).should('be.visible')

	cy.get('[data-testid="custom-points-chip-1"]').click()
	cy.get('[data-testid="custom-resolved-class"]').should('contain.text', 'asteroid')

	cy.get('[data-testid="custom-points-chip-5"]').click()
	cy.get('[data-testid="custom-resolved-class"]').should('contain.text', 'terrestrial')

	cy.get('[data-testid="custom-points-chip-8"]').click()
	cy.get('[data-testid="custom-resolved-class"]').should('contain.text', 'emissive')

	cy.get('[data-testid="custom-points-chip-21"]').click()
	cy.get('[data-testid="custom-resolved-class"]').should('contain.text', 'gas_giant')

	cy.get('[data-testid="custom-biome-chip-urgent"]').click()
	cy.get('[data-testid="custom-resolved-biome"]').should('contain.text', 'urgent')

	cy.get('[data-testid="hud-mode-chip-arcade"]').click()
	cy.get('[data-testid="custom-planet-preview"] [data-testid="planet-asset"]').should(
		'have.attr',
		'data-hud-mode',
		'arcade',
	)
})

it('customizes modular spaceship archetypes, triggers y+2px hardpoint recoil, and switches battery tiers', () => {
	cy.visit('/dev/assets')
	cy.get('[data-testid="ship-paper-doll-studio"]', { timeout: 15000 }).should(
		'be.visible',
	)

	cy.get('[data-testid="ship-archetype-hauler_atlas_mk1"]').click()
	cy.get(
		'[data-testid="ship-paper-doll-studio"] [data-testid="modular-starship"]',
	).should('have.attr', 'data-hull-archetype', 'hauler_atlas_mk1')

	cy.get('[data-testid="fire-recoil-button"]').click()
	cy.get(
		'[data-testid="ship-paper-doll-studio"] [data-testid="modular-starship"]',
	).should('have.attr', 'data-recoil-offset', '2')

	cy.get('[data-testid="battery-tier-battery_saver"]').click()
	cy.get('[data-testid="battery-telemetry-readout"]').should(
		'contain.text',
		'30 FPS',
	)
})
