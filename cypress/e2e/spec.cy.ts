before(() => {
	indexedDB.deleteDatabase('starfocus-zy0myinc2')
})

it('works', () => {
	cy.visit('/home')

	cy.get('#log').contains('Log').should('be.visible')
	cy.get('#important').contains('Important').should('be.visible')
	cy.get('#icebox').contains('Icebox').should('be.visible')

	cy.get('ion-fab-button').click()
	cy.get('ion-modal').within(() => {
		cy.contains('label', 'Title')
			.find('input')
			.wait(2000)
			.type('take the bins out')
		cy.contains('Confirm').click()
	})

	cy.get('#view-menu-button').click()
	cy.contains('ion-button', 'Edit roles')
	// For some reason clicking edit roles doesn't work so we hard-navigate
	cy.visit('/constellation')

	cy.contains('ion-title', 'Constellation')

	cy.get('ion-fab-button').click()
	cy.get('ion-modal').within(() => {
		cy.contains('label', 'Title').find('input').wait(2000).type('Father')
		cy.get('#icons ion-icon').first().click()
		cy.get('#selected-icon').should('have.attr', 'icon')
		cy.wait(1000)
		cy.contains('Confirm').click()
	})

	cy.get('ion-fab-button').click()
	cy.get('ion-modal').within(() => {
		cy.contains('label', 'Title').find('input').wait(2000).type('Partner')
		cy.get('#icons ion-icon').eq(1).click()
		cy.get('#selected-icon').should('have.attr', 'icon')
		cy.wait(1000)
		cy.contains('Confirm').click()
	})

	cy.visit('/home')

	cy.get('ion-fab-button').click()
	cy.get('ion-modal').within(() => {
		cy.contains('label', 'Title')
			.find('input')
			.wait(3000)
			.type('be silly together')
		cy.get('ion-select[label="Star role"]').click()
	})
	cy.get('ion-alert').within(() => {
		cy.contains('Father').click()
		cy.contains('OK').click()
	})
	cy.get('ion-modal').contains('Confirm').click()

	cy.get('ion-fab-button').click()
	cy.get('ion-modal').within(() => {
		cy.contains('label', 'Title')
			.find('input')
			.wait(2000)
			.type('plan birthday day out')
		cy.get('ion-select[label="Star role"]').click()
	})
	cy.get('ion-alert').within(() => {
		cy.contains('Partner').click()
		cy.contains('OK').click()
	})
	cy.get('ion-modal').contains('Confirm').click()

	cy.get('#icebox').contains('take the bins out').click()
	cy.get('#todo-action-sheet').contains('Move to important').click()
	cy.get('#important').contains('take the bins out')
	cy.get('#todo-action-sheet').should('not.exist')

	cy.get('#icebox').contains('be silly together').click()
	cy.get('#todo-action-sheet').contains('Move to important').click()
	cy.get('#important').contains('be silly together')
	cy.get('#todo-action-sheet').should('not.exist')

	cy.get('#icebox').contains('plan birthday day out').click()
	cy.get('#todo-action-sheet').contains('Move to important').click()
	cy.get('#important').contains('plan birthday day out')
	cy.get('#todo-action-sheet').should('not.exist')

	cy.get('#important')
		.contains('.todo', 'take the bins out')
		.find('ion-checkbox')
		.click()
	cy.get('#log').contains('take the bins out')
})
