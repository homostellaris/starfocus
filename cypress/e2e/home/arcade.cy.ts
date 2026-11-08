beforeEach(() => {
	cy.db(db => {
		db.close()
		return Promise.resolve()
	})
	cy.window().then(win => {
		if (win.db) win.db.close()
		return new Cypress.Promise(resolve => {
			const request = win.indexedDB.deleteDatabase('starfocus-z0vnq74nz')
			request.onsuccess = () => resolve(null)
			request.onerror = () => resolve(null)
			request.onblocked = () => resolve(null)
		})
	})
	cy.db(db => db.open())
	cy.visit('/home')
	cy.get('ion-fab>ion-fab-button', { timeout: 15000 }).should('be.visible')
})

it('renders deterministic procedural planet badges for todos on /home and transitions seamlessly into and out of Game Mode', () => {
	cy.db(async db => {
		await db.todos.bulkAdd([
			{
				id: 'home-asteroid-1',
				title: 'Quick telemetry check',
				starPoints: 1,
			},
			{
				id: 'home-emissive-8',
				title: 'Deep cryo reactor calibration',
				starPoints: 8,
			},
		])
		await db.wayfinderOrder.bulkAdd([
			{ todoId: 'home-emissive-8', order: 'a' },
			{ todoId: 'home-asteroid-1', order: 'b' },
		])
	})

	cy.get(
		'[data-testid="planet-asset"][data-todo-id="home-emissive-8"]',
		{ timeout: 10000 },
	).should('have.attr', 'data-celestial-class', 'emissive')

	cy.get(
		'[data-testid="planet-asset"][data-todo-id="home-asteroid-1"]',
	).should('have.attr', 'data-celestial-class', 'asteroid')

	cy.get('#starship').dblclick({ force: true })

	cy.get('[data-testid="home-productivity-overlay"]').should(
		'have.attr',
		'data-arcade-mode',
		'true',
	)
	cy.get('[data-testid="space-arcade-canvas"]').should(
		'have.attr',
		'data-arcade-active',
		'true',
	)

	cy.get('[data-testid="arcade-fire-button"]').click()
	cy.get('[data-testid="space-arcade-canvas"]').should(
		'have.attr',
		'data-shots-fired',
		'1',
	)

	cy.get('[data-testid="arcade-exit-button"]').click()
	cy.get('[data-testid="home-productivity-overlay"]').should(
		'have.attr',
		'data-arcade-mode',
		'false',
	)
	cy.contains('Deep cryo reactor calibration').should('be.visible')
})
