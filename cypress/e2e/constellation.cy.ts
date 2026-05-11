beforeEach(() => {
	cy.db(db => {
		db.close()
		return Promise.resolve()
	})
	cy.window().then(win => {
		if (win.db) win.db.close()
		return new Cypress.Promise(resolve => {
			const request = win.indexedDB.deleteDatabase('starfocus')
			request.onsuccess = () => resolve(null)
			request.onerror = () => resolve(null)
			request.onblocked = () => resolve(null)
		})
	})
	cy.db(db => db.open())
	cy.visit('/home', {
		onBeforeLoad(win) {
			win.localStorage.setItem('help-enabled', 'true')
		},
	})
	cy.get('ion-fab>ion-fab-button').should('be.visible')
})

it('navigates to constellation page via edit roles button', () => {
	cy.get('#view-menu-button').click()
	cy.get('#view-menu').should('be.visible')
	cy.get('#view-menu').contains('Edit roles').click()
	cy.url().should('include', '/constellation')
	cy.contains('Create some roles to focus on what matters').should('be.visible')
	cy.get('ion-fab>ion-fab-button').should('exist')
})

describe('star role order', () => {
	beforeEach(() => {
		cy.get('#view-menu-button').click()
		cy.get('#view-menu').contains('Edit roles').click()
		cy.url().should('include', '/constellation')
	})

	it('displays star roles sorted by their order', () => {
		cy.db(async db => {
			const alphaId = await db.starRoles.add({
				title: 'Alpha',
				icon: { type: 'ionicon', name: 'starSharp' },
			})
			const betaId = await db.starRoles.add({
				title: 'Beta',
				icon: { type: 'ionicon', name: 'starSharp' },
			})
			// Beta (order 0) should appear before Alpha (order 1)
			await db.starRolesOrder.bulkAdd([
				{ starRoleId: betaId as string, order: 0 },
				{ starRoleId: alphaId as string, order: 1 },
			])
		})
		cy.reload()

		cy.get('ion-item ion-label').then($labels => {
			const titles = $labels.toArray().map(el => el.textContent)
			expect(titles.indexOf('Beta')).to.be.lessThan(titles.indexOf('Alpha'))
		})
	})
})

describe('star role description', () => {
	beforeEach(() => {
		cy.get('#view-menu-button').click()
		cy.get('#view-menu').contains('Edit roles').click()
		cy.url().should('include', '/constellation')
	})

	it('persists description when creating a star role', () => {
		cy.get('ion-fab>ion-fab-button').click()
		cy.get('#create-star-role').click()

		cy.get('ion-input[label="Title"]').find('input').type('Developer')
		cy.get('ion-textarea[label="Description"]')
			.find('textarea')
			.type('Software development and code review tasks')

		// Search for and select an icon
		cy.get('ion-input[label="Icon"]').find('input').type('code')
		cy.get('#icons ion-icon').first().click()

		cy.contains('ion-button', 'Confirm').click()

		cy.db(async db => {
			const starRoles = await db.starRoles.toArray()
			const developer = starRoles.find(sr => sr.title === 'Developer')
			expect(developer?.description).to.equal(
				'Software development and code review tasks',
			)
		})
	})
})
