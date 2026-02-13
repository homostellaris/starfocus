import dayjs from 'dayjs'
import { Potodo } from '../../components/db'

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
	cy.get('ion-fab>ion-fab-button', { timeout: 10000 }).should('be.visible')
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
		cy.visit('/home')
		cy.get('ion-fab>ion-fab-button', { timeout: 10000 }).should('be.visible')
		cy.clock(dayjs('2025-01-01').valueOf(), ['Date'])
	})

	it('removes todo from view until the snoozed date', () => {
		createTodo({ title: 'take the bins out' })
		cy.get('[data-class="todo"]').click()
		cy.get('#todo-action-sheet').should('be.visible')
		cy.get('#todo-action-sheet').contains('Snooze').click()
		cy.get('[data-day="3"][data-month="1"][data-year="2025"]')
			.should('be.visible')
			.click()
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
		cy.get('ion-fab>ion-fab-button').should('be.visible')
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
		cy.get('#settings-menu-button').should('be.visible').click()
		cy.contains('ion-title', 'Settings').should('be.visible')
		// Ionic menu animation must complete before toggle() will close it
		cy.wait(500)
		cy.get('ion-menu')
			.contains('ion-button', 'Cancel')
			.should('be.visible')
			.click()
		cy.contains('ion-title', 'Settings').should('not.be.visible')
	})
})

describe.skip('notes', () => {})

it('works', () => {
	cy.get('ion-fab>ion-fab-button').click()
	cy.get('#create-todo-modal')
		.should('be.visible')
		.within(() => {
			cy.contains('label', 'Title')
				.find('input')
				.should('be.visible')
				.type('take the bins out')
			cy.contains('Confirm').click()
		})

	assertLists(['take the bins out'], [])

	cy.db(db =>
		db.starRoles.add({
			title: 'Father',
			icon: { type: 'ionicon', name: 'maleSharp' },
		}),
	)
	cy.db(db =>
		db.starRoles.add({
			title: 'Partner',
			icon: { type: 'ionicon', name: 'heartSharp' },
		}),
	)

	cy.get('ion-fab>ion-fab-button').should('be.visible').click()
	cy.get('#create-todo-modal')
		.should('be.visible')
		.within(() => {
			cy.contains('label', 'Title')
				.find('input')
				.should('be.visible')
				.type('be silly together')
			cy.get('ion-select[label="Star role"]').click()
		})
	cy.get('ion-alert')
		.should('be.visible')
		.within(() => {
			cy.contains('Father').click()
			cy.contains('OK').click()
		})
	cy.get('#create-todo-modal').contains('Confirm').click()

	cy.get('ion-fab>ion-fab-button').click()
	cy.get('#create-todo-modal')
		.should('be.visible')
		.within(() => {
			cy.contains('label', 'Title')
				.find('input')
				.should('be.visible')
				.type('plan birthday day out')
			cy.get('ion-select[label="Star role"]').click()
		})
	cy.get('ion-alert')
		.should('be.visible')
		.within(() => {
			cy.contains('Partner').click()
			cy.contains('OK').click()
		})
	cy.get('#create-todo-modal').contains('Confirm').click()

	assertLists(
		['plan birthday day out', 'be silly together', 'take the bins out'],
		[],
	)

	cy.get('#log-and-wayfinder').contains('be silly together').click()
	cy.get('#todo-action-sheet').should('be.visible')
	cy.get('#todo-action-sheet').contains('Move to database').click()
	cy.get('#database').contains('be silly together')
	cy.get('#todo-action-sheet').should('not.exist')

	cy.get('#log-and-wayfinder').contains('plan birthday day out').click()
	cy.get('#todo-action-sheet').should('be.visible')
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
	if (wayfinder.length > 0) {
		cy.get('#log-and-wayfinder [data-class="todo"] [data-class="title"]')
			.should('have.length', wayfinder.length)
			.then($els => $els.toArray().map(el => el.textContent))
			.should('deep.equal', wayfinder)
	} else {
		cy.get('#log-and-wayfinder [data-class="todo"]').should('not.exist')
	}

	if (database.length > 0) {
		cy.get('#database [data-class="todo"] [data-class="title"]')
			.should('have.length', database.length)
			.then($els => $els.toArray().map(el => el.textContent))
			.should('deep.equal', database)
	} else {
		cy.get('#database [data-class="todo"]').should('not.exist')
	}
}

function assertList(id: string, todos: Array<string | Potodo>) {
	cy.get(`#${id} [data-class="todo"]`)
		.should('have.length', todos.length)
		.then($els => {
			$els.toArray().forEach((item, index) => {
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
	cy.get('#create-todo-modal')
		.should('be.visible')
		.within(() => {
			cy.contains('label', 'Title')
				.find('input')
				.should('be.visible')
				.type(title)
		})

	if (starRole) {
		cy.get('ion-select[label="Star role"]').click()
		cy.get('ion-alert')
			.should('be.visible')
			.within(() => {
				cy.contains('Father').click()
				cy.contains('OK').click()
			})
	}

	if (starPoints) {
		cy.get('ion-select[label="Star points"]').click()
		cy.get('ion-select-popover')
			.should('be.visible')
			.within(() => {
				cy.contains(starPoints.toString()).click()
			})
	}

	cy.get('#create-todo-modal').contains('Confirm').click()
	cy.get('#create-todo-modal').should('not.exist')
}
