import dayjs from 'dayjs'
import { db, Potodo, Todo } from '../../components/db'

beforeEach(() => {
	indexedDB.deleteDatabase('starfocus-z0vnq74nz')
})

describe.skip('constellation', () => {})

describe.skip('star roles', () => {})

describe.skip('star roles groups', () => {})

describe.skip('star points', () => {})

describe.skip('star sort', () => {})

describe('asteroid field', () => {
	it('stores todos with no star points', () => {
		createTodo({ title: 'take the bins out' })
		assertList('asteroid-field', ['take the bins out'])
	})

	it('stores todos with no star points and star role', () => {
		new Cypress.Promise((resolve, reject) => {
			db.starRoles
				.add({
					title: 'Father',
					icon: {
						type: 'ionicon',
						name: 'maleSharp',
					},
				})
				.then(resolve)
				.catch(reject)
		})
		createTodo({ title: 'be silly together', starRole: 'Father' })
		assertList('asteroid-field', [
			{ title: 'be silly together', starRole: 'Father' },
		])
	})
})

describe('wayfinder', () => {
	it('stores todos with star points', () => {
		new Cypress.Promise((resolve, reject) => {
			db.starRoles
				.add({
					title: 'Father',
					icon: {
						type: 'ionicon',
						name: 'maleSharp',
					},
				})
				.then(resolve)
				.catch(reject)
		})
		createTodo({ title: 'be silly together', starPoints: 1 })
		assertList('wayfinder', ['be silly together'])
	})

	it('stores todos with star points and star role', () => {
		new Cypress.Promise((resolve, reject) => {
			db.starRoles
				.add({
					title: 'Father',
					icon: {
						type: 'ionicon',
						name: 'maleSharp',
					},
				})
				.then(resolve)
				.catch(reject)
		})
		createTodo({
			title: 'be silly together',
			starRole: 'Father',
			starPoints: 1,
		})
		assertList('wayfinder', [
			{ title: 'be silly together', starPoints: 1, starRole: 'Father' },
		])
	})

	it.skip('can edit todos')
	it.skip('can reorder todos')
	it.skip('can move todos between lists')
	it.skip('can complete todos')
	it.skip('can log visits')
})

describe.skip('log', () => {})

describe.skip('database', () => {})

describe.skip('focus', () => {
	it.skip('can focus a star role')
	it.skip('can focus a star role group')
})

describe('snooze', () => {
	beforeEach(() => {
		cy.clock(dayjs('2025-01-01').valueOf(), ['Date'])
		cy.visit('/home')
		cy.tick(1000)
	})

	it.only('removes todo from view until the snoozed date', () => {
		createTodo({ title: 'take the bins out' })
		cy.get('[data-class="todo"]').click()
		cy.get('#todo-action-sheet').contains('Snooze').click()
		cy.get('[aria-label="Friday 3 January"]').click()
		cy.contains('Confirm')
			.click()
			.wait(1000)
			.then(
				() =>
					new Cypress.Promise((resolve, reject) =>
						db.asteroidFieldOrder.toArray().then(resolve).catch(reject),
					),
			)
			.its('0.snoozedUntil')
			.invoke('toISOString')
			.should('eq', '2025-01-03T00:00:00.000Z')

		cy.get('[data-class="todo"]').should('not.exist')
	})
})

describe('search', () => {
	beforeEach(() => {
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
		cy.get('#settings-menu-button').click()
		cy.contains('ion-title', 'Settings').should('be.visible')
		cy.wait(1000)
		cy.get('ion-button').contains('Cancel').click()
		cy.contains('ion-title', 'Settings').should('not.be.visible')
	})
})

describe.skip('notes', () => {})

it('works', () => {
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

	cy.go('back')
	cy.wait(1000) // No idea why this is necessary but otherwise the create todo modal doesn't open

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
	cy.get('#todo-action-sheet').contains('Move to database').click()
	cy.get('#database').contains('be silly together')
	cy.get('#todo-action-sheet').should('not.exist')

	cy.get('#log-and-wayfinder').contains('plan birthday day out').click()
	cy.get('#todo-action-sheet').contains('Move to database').click()
	cy.get('#database').contains('plan birthday day out')
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

function assertLists(wayfinder: string[], database: string[]) {
	cy.get('#log-and-wayfinder [data-class="todo"] [data-class="title"]')
		.should('have.length', wayfinder.length)
		.invoke('toArray')
		.invoke('map', item => item.textContent)
		.should('deep.equal', wayfinder)
	cy.get('#database [data-class="todo"] [data-class="title"]')
		.should('have.length', database.length)
		.invoke('toArray')
		.invoke('map', item => item.textContent)
		.should('deep.equal', database)
}

function assertList(id: string, todos: Array<string | Potodo>) {
	cy.get(`#${id} [data-class="todo"]`)
		.should('have.length', todos.length)
		.invoke('toArray')
		.invoke('map', (item, index) => {
			const todo: any = todos[index]
			if (typeof todo === 'string') {
				expect(item.querySelector('[data-class="title"]').textContent).to.eq(
					todo,
				)
			} else {
				expect(item.querySelector('[data-class="title"]').textContent).to.eq(
					todo.title,
				)
				expect(
					item.querySelector('[data-class="star-role-icon"]').dataset.starRole,
				).to.eq(todo.starRole ?? null)
				expect(item.querySelector('[data-star-points]')?.textContent).to.eq(
					todo.starPoints?.toString() ?? undefined,
				)
			}
		})
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

function createTodo({
	title,
	starPoints,
	starRole,
}: {
	title: string
	starPoints?: number
	starRole?: string
}) {
	cy.get('ion-fab>ion-fab-button').click()
	cy.get('#create-todo-modal').within(() => {
		cy.contains('label', 'Title').find('input').wait(2000).type(title)
	})

	if (starRole) {
		cy.get('ion-select[label="Star role"]').click()
		cy.get('ion-alert').within(() => {
			cy.contains('Father').click()
			cy.contains('OK').click()
		})
	}

	if (starPoints) {
		cy.get('ion-select[label="Star points"]').click()
		cy.get('ion-select-popover').within(() => {
			cy.contains(starPoints.toString()).click()
		})
	}

	cy.get('#create-todo-modal').contains('Confirm').click()
}
