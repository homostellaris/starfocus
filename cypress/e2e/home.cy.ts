import dayjs from 'dayjs'
import { Potodo } from '../../components/db'

beforeEach(() => {
	cy.visit('/home')
	cy.window().then(win => {
		return new Cypress.Promise(resolve => {
			const request = win.indexedDB.deleteDatabase('starfocus-z0vnq74nz')
			request.onsuccess = () => resolve(null)
			request.onerror = () => resolve(null)
			request.onblocked = () => resolve(null)
		})
	})
})

describe.skip('constellation', () => {})

describe.skip('star roles', () => {})

describe.skip('star roles groups', () => {})

describe.skip('star points', () => {})

describe.skip('star sort', () => {})

describe('asteroid field', () => {
	beforeEach(() => {
		cy.visit('/home')
		cy.get('ion-fab>ion-fab-button').should('be.visible')
	})

	it('stores todos with no star points', () => {
		createTodo({ title: 'take the bins out' })
		assertList('asteroid-field', ['take the bins out'])
	})

	it('stores todos with no star points and star role', () => {
		cy.db(db =>
			db.starRoles.add({
				title: 'Father',
				icon: {
					type: 'ionicon',
					name: 'maleSharp',
				},
			}),
		)
		createTodo({ title: 'be silly together', starRole: 'Father' })
		assertList('asteroid-field', [
			{ title: 'be silly together', starRole: 'Father' },
		])
	})
})

describe('wayfinder', () => {
	beforeEach(() => {
		cy.visit('/home')
		cy.get('ion-fab>ion-fab-button').should('be.visible')
	})

	it('stores todos with star points', () => {
		cy.db(db =>
			db.starRoles.add({
				title: 'Father',
				icon: {
					type: 'ionicon',
					name: 'maleSharp',
				},
			}),
		)
		createTodo({ title: 'be silly together', starPoints: 1 })
		assertList('wayfinder', ['be silly together'])
	})

	it('stores todos with star points and star role', () => {
		cy.db(db =>
			db.starRoles.add({
				title: 'Father',
				icon: {
					type: 'ionicon',
					name: 'maleSharp',
				},
			}),
		)
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
		cy.get('ion-fab>ion-fab-button').should('be.visible')
	})

	it('removes todo from view until the snoozed date', () => {
		createTodo({ title: 'take the bins out' })
		cy.get('[data-class="todo"]').click()
		cy.get('#todo-action-sheet').contains('Snooze').click()
		cy.get('[data-day="3"][data-month="1"][data-year="2025"]').click()
		cy.contains('Confirm').click()
		cy.get('[data-class="todo"]').should('not.exist')
		cy.db(db => db.asteroidFieldOrder.toArray())
			.its('0.snoozedUntil')
			.invoke('toISOString')
			.should('eq', '2025-01-03T00:00:00.000Z')
	})
})

describe('search', () => {
	beforeEach(() => {
		cy.db(db =>
			db.todos.bulkAdd([
				{
					title: 'take the bins out',
				},
				{
					title: 'walk the dog',
				},
				{
					title: 'eat a bin',
				},
			]),
		)
		cy.visit('/home')
	})

	it('can search for a todo by title', () => {
		assertLists([], ['eat a bin', 'walk the dog', 'take the bins out'])
		cy.get('[role="search"] input').type('dog')
		assertLists([], ['walk the dog'])
	})

	it.skip('can search for snoozed todos')
})

describe('setting', () => {
	beforeEach(() => {
		cy.visit('/home')
		cy.get('#settings-menu-button').should('be.visible')
	})

	it('can open and close the settings panel', () => {
		cy.get('#settings-menu-button').click()
		cy.contains('ion-title', 'Settings').should('be.visible')
		// Wait for menu animation to complete before clicking Cancel
		cy.wait(500)
		cy.get('ion-menu').contains('ion-button', 'Cancel').click()
		cy.contains('ion-title', 'Settings').should('not.be.visible')
	})
})

describe.skip('notes', () => {})

it('works', () => {
	cy.visit('/home')
	cy.get('ion-fab>ion-fab-button').should('be.visible').click()
	cy.get('#create-todo-modal').within(() => {
		cy.contains('label', 'Title')
			.find('input')
			.should('be.visible')
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
		cy.contains('label', 'Title')
			.find('input')
			.should('be.visible')
			.type('Father')
		cy.get('#icons ion-icon').first().click()
		cy.get('#selected-icon').should('have.attr', 'icon')
		cy.contains('Confirm').should('be.visible').click()
	})
	cy.get('#create-star-role-modal').should('not.exist')

	cy.get('ion-fab>ion-fab-button').click()
	cy.get('#create-star-role').click()
	cy.get('#create-star-role-modal').within(() => {
		cy.contains('label', 'Title')
			.find('input')
			.should('be.visible')
			.type('Partner')
		cy.get('#icons ion-icon').eq(1).click()
		cy.get('#selected-icon').should('have.attr', 'icon')
		cy.contains('Confirm').should('be.visible').click()
	})
	cy.get('#create-star-role-modal').should('not.exist')

	cy.go('back')
	cy.url().should('include', '/home')
	cy.get('ion-fab>ion-fab-button').should('be.visible').click()
	cy.get('#create-todo-modal').within(() => {
		cy.contains('label', 'Title')
			.find('input')
			.should('be.visible')
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
			.should('be.visible')
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
		.invoke('map', (item: Element) => item.textContent)
		.should('deep.equal', wayfinder)
	cy.get('#database [data-class="todo"] [data-class="title"]')
		.should('have.length', database.length)
		.invoke('toArray')
		.invoke('map', (item: Element) => item.textContent)
		.should('deep.equal', database)
}

function assertList(id: string, todos: Array<string | Potodo>) {
	cy.get(`#${id} [data-class="todo"]`)
		.should('have.length', todos.length)
		.invoke('toArray')
		.invoke('map', (item: HTMLElement, index: number) => {
			const todo: any = todos[index]
			if (typeof todo === 'string') {
				expect(item.querySelector('[data-class="title"]')!.textContent).to.eq(
					todo,
				)
			} else {
				expect(item.querySelector('[data-class="title"]')!.textContent).to.eq(
					todo.title,
				)
				expect(
					(item.querySelector('[data-class="star-role-icon"]') as HTMLElement)
						?.dataset.starRole,
				).to.eq(todo.starRole ?? null)
				expect(item.querySelector('[data-star-points]')?.textContent).to.eq(
					todo.starPoints?.toString() ?? undefined,
				)
			}
		})
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
		cy.contains('label', 'Title').find('input').should('be.visible').type(title)
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
