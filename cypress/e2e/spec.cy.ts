import { db } from '../../components/db'

beforeEach(() => {
	indexedDB.deleteDatabase('starfocus-z0vnq74nz')
})

describe('onboarding', () => {
	it('can navigate from landing page to app', () => {
		cy.visit('/')
		cy.contains('Try it').click()
		cy.get('ion-content').should('exist')
	})
})

describe.skip('constellation', () => {})

describe.skip('star roles', () => {})

describe.skip('star roles groups', () => {})

describe.skip('star points', () => {})

describe.skip('star sort', () => {})

describe.skip('wayfinder', () => {
	it.skip('can edit todos')
	it.skip('can reorder todos')
	it.skip('can move todos between lists')
	it.skip('can complete todos')
	it.skip('can log visits')
})

describe.skip('log', () => {})

describe.skip('icebox', () => {})

describe.skip('focus', () => {
	it.skip('can focus a star role')
	it.skip('can focus a star role group')
})

describe('search', () => {
	beforeEach(() => {
		cy.visit('/home')
		new Cypress.Promise((resolve, reject) => {
			db.todos
				.bulkAdd([
					{
						title: 'take the bins out',
					},
					{
						title: 'walk the dog',
					},
					{
						title: 'eat a bin',
					},
				])
				.then(resolve)
				.catch(reject)
		})
	})

	it('can search for a todo by title', () => {
		assertLists([], ['eat a bin', 'walk the dog', 'take the bins out'])
		cy.get('[role="search"] input').type('dog')
		assertLists([], ['walk the dog'])
	})

	it.skip('can search for snoozed todos')
})

describe('setting', () => {
	it('can open and close the settings panel', () => {
		cy.visit('/home')
		cy.get('#settings-menu-button').click()
		cy.contains('ion-title', 'Settings').should('be.visible')
		cy.wait(1000)
		cy.get('ion-button').contains('Cancel').click()
		cy.contains('ion-title', 'Settings').should('not.be.visible')
	})
})

describe.skip('notes', () => {})

it('works', () => {
	cy.visit('/home')

	cy.get('ion-fab>ion-fab-button').click()
	cy.get('#create-todo-modal').within(() => {
		cy.contains('label', 'Title')
			.find('input')
			.wait(2000)
			.type('take the bins out')
		cy.contains('Confirm').click()
	})

	assertLists(['take the bins out'], [])

	cy.get('#view-menu-button').click()
	cy.contains('ion-button', 'Edit roles')
	// For some reason clicking edit roles doesn't work so we hard-navigate
	cy.visit('/constellation')

	cy.get('ion-fab>ion-fab-button').click()
	cy.get('#create-star-role').click()
	cy.get('#create-star-role-modal').within(() => {
		cy.contains('label', 'Title').find('input').wait(2000).type('Father')
		cy.get('#icons ion-icon').first().click()
		cy.get('#selected-icon').should('have.attr', 'icon')
		cy.wait(1000)
		cy.contains('Confirm').click()
	})

	cy.get('ion-fab>ion-fab-button').click()
	cy.get('#create-star-role').click()
	cy.get('#create-star-role-modal').within(() => {
		cy.contains('label', 'Title').find('input').wait(2000).type('Partner')
		cy.get('#icons ion-icon').eq(1).click()
		cy.get('#selected-icon').should('have.attr', 'icon')
		cy.wait(1000)
		cy.contains('Confirm').click()
	})

	cy.visit('/home')

	cy.get('ion-fab>ion-fab-button').click()
	cy.get('#create-todo-modal').within(() => {
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
	cy.get('#create-todo-modal').contains('Confirm').click()

	cy.get('ion-fab>ion-fab-button').click()
	cy.get('#create-todo-modal').within(() => {
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
	cy.get('#create-todo-modal').contains('Confirm').click()

	assertLists(
		['plan birthday day out', 'be silly together', 'take the bins out'],
		[],
	)

	cy.get('#log-and-wayfinder').contains('be silly together').click()
	cy.get('#todo-action-sheet').contains('Move to icebox').click()
	cy.get('#icebox').contains('be silly together')
	cy.get('#todo-action-sheet').should('not.exist')

	cy.get('#log-and-wayfinder').contains('plan birthday day out').click()
	cy.get('#todo-action-sheet').contains('Move to icebox').click()
	cy.get('#icebox').contains('plan birthday day out')
	cy.get('#todo-action-sheet').should('not.exist')

	assertLists(
		['take the bins out'],
		['plan birthday day out', 'be silly together'],
	)

	cy.get('#log-and-wayfinder')
		.contains('[data-class="todo"]', 'take the bins out')
		.find('ion-checkbox')
		.click()

	assertLists(
		['take the bins out'],
		['plan birthday day out', 'be silly together'],
	)
})

function assertLists(wayfinder: string[], icebox: string[]) {
	cy.get('#log-and-wayfinder [data-class="todo"] [data-class="title"]')
		.should('have.length', wayfinder.length)
		.invoke('toArray')
		.invoke('map', item => item.textContent)
		.should('deep.equal', wayfinder)
	cy.get('#icebox [data-class="todo"] [data-class="title"]')
		.should('have.length', icebox.length)
		.invoke('toArray')
		.invoke('map', item => item.textContent)
		.should('deep.equal', icebox)
}

function reorderWayfinderTodo(todoIndex: number, places: number) {
	cy.get(`#log-and-wayfinder [data-class="todo"]`)
		.eq(todoIndex)
		.find('ion-reorder')
		.shadow()
		.find('.reorder-icon')
		.trigger('mousedown', { which: 1 })
		.trigger('mousemove', { screenX: 936, screenY: 287 + 49 })
		.trigger('mouseup')
}
