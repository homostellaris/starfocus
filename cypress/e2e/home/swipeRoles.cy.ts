function seedThreeStarRolesAndTodos() {
	cy.db(async database => {
		const familyGroupIdentifier = (await database.starRoleGroups.add({
			title: 'Family',
		})) as string
		const craftGroupIdentifier = (await database.starRoleGroups.add({
			title: 'Craft',
		})) as string

		const fatherIdentifier = (await database.starRoles.add({
			title: 'Father',
			description: 'Present and playful',
			starRoleGroupId: familyGroupIdentifier,
			icon: { type: 'ionicon', name: 'maleSharp' },
		})) as string
		const partnerIdentifier = (await database.starRoles.add({
			title: 'Partner',
			description: 'Shared adventures',
			starRoleGroupId: familyGroupIdentifier,
			icon: { type: 'ionicon', name: 'heartSharp' },
		})) as string
		const engineerIdentifier = (await database.starRoles.add({
			title: 'Engineer',
			description: 'Build starships',
			starRoleGroupId: craftGroupIdentifier,
			icon: { type: 'ionicon', name: 'rocketSharp' },
		})) as string

		await database.starRolesOrder.bulkAdd([
			{ starRoleId: fatherIdentifier, order: 0 },
			{ starRoleId: partnerIdentifier, order: 1 },
			{ starRoleId: engineerIdentifier, order: 2 },
		])

		const fatherTodoIdentifier = (await database.todos.add({
			title: 'Father task',
			starRole: fatherIdentifier,
		})) as string
		const partnerTodoIdentifier = (await database.todos.add({
			title: 'Partner task',
			starRole: partnerIdentifier,
		})) as string
		const engineerTodoIdentifier = (await database.todos.add({
			title: 'Engineer task',
			starRole: engineerIdentifier,
		})) as string

		await database.wayfinderOrder.bulkAdd([
			{ todoId: fatherTodoIdentifier, order: 'a' },
			{ todoId: partnerTodoIdentifier, order: 'b' },
			{ todoId: engineerTodoIdentifier, order: 'c' },
		])
	})
}

let activeDragEndPoint = { x: 0, y: 0, pointerType: 'touch' as 'touch' | 'mouse' }

function dragOnElement(
	selector: string,
	{
		deltaX,
		deltaY = 0,
		steps = 6,
		pointerType = 'touch',
		release = true,
	}: {
		deltaX: number
		deltaY?: number
		steps?: number
		pointerType?: 'touch' | 'mouse'
		release?: boolean
	},
) {
	cy.get(selector)
		.first()
		.then($element => {
			const element = $element[0]
			const rect = element.getBoundingClientRect()
			const startX = rect.left + rect.width / 2
			const startY = rect.top + rect.height / 2
			const windowReference = element.ownerDocument.defaultView!

			activeDragEndPoint = {
				x: startX + deltaX,
				y: startY + deltaY,
				pointerType,
			}

			element.dispatchEvent(
				new windowReference.PointerEvent('pointerdown', {
					bubbles: true,
					composed: true,
					cancelable: true,
					isPrimary: true,
					pointerId: 1,
					pointerType,
					button: 0,
					buttons: 1,
					clientX: startX,
					clientY: startY,
				}),
			)

			for (let step = 1; step <= steps; step += 1) {
				const fraction = step / steps
				windowReference.dispatchEvent(
					new windowReference.PointerEvent('pointermove', {
						bubbles: true,
						cancelable: true,
						isPrimary: true,
						pointerId: 1,
						pointerType,
						buttons: 1,
						clientX: startX + deltaX * fraction,
						clientY: startY + deltaY * fraction,
					}),
				)
			}

			if (release) {
				windowReference.dispatchEvent(
					new windowReference.PointerEvent('pointerup', {
						bubbles: true,
						cancelable: true,
						isPrimary: true,
						pointerId: 1,
						pointerType,
						button: 0,
						buttons: 0,
						clientX: startX + deltaX,
						clientY: startY + deltaY,
					}),
				)
			}
		})
}

function releaseActiveDrag() {
	cy.window().then(windowReference => {
		windowReference.dispatchEvent(
			new windowReference.PointerEvent('pointerup', {
				bubbles: true,
				cancelable: true,
				isPrimary: true,
				pointerId: 1,
				pointerType: activeDragEndPoint.pointerType,
				button: 0,
				buttons: 0,
				clientX: activeDragEndPoint.x,
				clientY: activeDragEndPoint.y,
			}),
		)
	})
}

beforeEach(() => {
	cy.db(database => {
		database.close()
		return Promise.resolve()
	})
	cy.window().then(windowReference => {
		if (windowReference.db) windowReference.db.close()
		return new Cypress.Promise(resolve => {
			const request = windowReference.indexedDB.deleteDatabase(
				'starfocus-z0vnq74nz',
			)
			request.onsuccess = () => resolve(null)
			request.onerror = () => resolve(null)
			request.onblocked = () => resolve(null)
		})
	})
	cy.db(database => database.open())
	cy.visit('/home')
	cy.get('ion-fab>ion-fab-button', { timeout: 10000 }).should('be.visible')
	seedThreeStarRolesAndTodos()
	cy.contains('#wayfinder ion-label', 'Father task', { timeout: 10000 }).should(
		'be.visible',
	)
	cy.contains('#wayfinder ion-label', 'Partner task').should('be.visible')
	cy.contains('#wayfinder ion-label', 'Engineer task').should('be.visible')
})

it('switches star role on real Chromium touch swipe across main list body', () => {
	cy.get('#wayfinder [data-class="title"]')
		.first()
		.realSwipe('toLeft', { length: 180, step: 15, touchPosition: 'center' })

	cy.contains('#wayfinder ion-label', 'Father task').should('be.visible')
	cy.contains('#wayfinder ion-label', 'Partner task').should('not.exist')
	cy.contains('#wayfinder ion-label', 'Engineer task').should('not.exist')
})

it('shows finger-driven overlay on horizontal swipe across list body and commits filter only on release', () => {
	dragOnElement('#wayfinder [data-class="title"]', {
		deltaX: -120,
		pointerType: 'touch',
		release: false,
	})

	cy.get('[data-testid="star-role-switcher-overlay"]')
		.should('exist')
		.and('have.css', 'opacity', '1')
		.and('have.css', 'z-index', '50')
		.and('have.attr', 'data-phase', 'swiping')
		.and('have.attr', 'data-from-role', 'All')
		.and('have.attr', 'data-to-role', 'Father')
	cy.get('[data-testid="switcher-from-role"]').should('contain.text', 'All')
	cy.get('[data-testid="switcher-to-role"]').should('contain.text', 'Father')

	// Filter must stay unchanged until release
	cy.contains('#wayfinder ion-label', 'Partner task').should('be.visible')
	cy.contains('#wayfinder ion-label', 'Engineer task').should('be.visible')

	releaseActiveDrag()

	cy.contains('#wayfinder ion-label', 'Father task').should('be.visible')
	cy.contains('#wayfinder ion-label', 'Partner task').should('not.exist')
	cy.contains('#wayfinder ion-label', 'Engineer task').should('not.exist')
	cy.get('ion-action-sheet').should('not.exist')
})

it('navigates forward and backward across individual roles, skipping star role groups, and updates the header title', () => {
	cy.get('#main-content ion-header ion-title').should('have.text', 'All')

	dragOnElement('#wayfinder [data-class="title"]', {
		deltaX: -140,
		pointerType: 'mouse',
	})
	cy.get('#main-content ion-header ion-title').should('have.text', 'Father')
	cy.contains('#wayfinder ion-label', 'Father task').should('be.visible')
	cy.contains('#wayfinder ion-label', 'Partner task').should('not.exist')

	cy.get('[data-testid="star-role-switcher-overlay"]', {
		timeout: 5000,
	}).should('not.exist')

	dragOnElement('#wayfinder [data-class="title"]', {
		deltaX: -140,
		pointerType: 'mouse',
	})
	cy.get('#main-content ion-header ion-title').should('have.text', 'Partner')
	cy.contains('#wayfinder ion-label', 'Partner task').should('be.visible')
	cy.contains('#wayfinder ion-label', 'Father task').should('not.exist')

	cy.get('[data-testid="star-role-switcher-overlay"]', {
		timeout: 5000,
	}).should('not.exist')

	dragOnElement('#wayfinder [data-class="title"]', {
		deltaX: -140,
		pointerType: 'mouse',
	})
	cy.get('#main-content ion-header ion-title').should('have.text', 'Engineer')
	cy.contains('#wayfinder ion-label', 'Engineer task').should('be.visible')
	cy.contains('#wayfinder ion-label', 'Partner task').should('not.exist')

	cy.get('[data-testid="star-role-switcher-overlay"]', {
		timeout: 5000,
	}).should('not.exist')

	dragOnElement('#wayfinder [data-class="title"]', {
		deltaX: -140,
		pointerType: 'mouse',
	})
	cy.get('#main-content ion-header ion-title').should('have.text', 'All')
	cy.contains('#wayfinder ion-label', 'Father task').should('be.visible')
	cy.contains('#wayfinder ion-label', 'Partner task').should('be.visible')
	cy.contains('#wayfinder ion-label', 'Engineer task').should('be.visible')

	cy.get('[data-testid="star-role-switcher-overlay"]', {
		timeout: 5000,
	}).should('not.exist')

	dragOnElement('#wayfinder [data-class="title"]', {
		deltaX: 140,
		pointerType: 'mouse',
	})
	cy.get('#main-content ion-header ion-title').should('have.text', 'Engineer')
	cy.contains('#wayfinder ion-label', 'Engineer task').should('be.visible')
	cy.contains('#wayfinder ion-label', 'Father task').should('not.exist')
})

it('accepts rapid consecutive swipes immediately during commit transition without dropping input', () => {
	dragOnElement('#wayfinder [data-class="title"]', {
		deltaX: -140,
		pointerType: 'touch',
	})

	cy.get('[data-testid="star-role-switcher-overlay"]')
		.should('exist')
		.and('have.attr', 'data-phase', 'committing')
		.and('have.attr', 'data-to-role', 'Father')

	dragOnElement('#wayfinder [data-class="title"]', {
		deltaX: -140,
		pointerType: 'touch',
		release: false,
	})

	cy.get('[data-testid="star-role-switcher-overlay"]')
		.should('exist')
		.and('have.attr', 'data-phase', 'swiping')
		.and('have.attr', 'data-from-role', 'Father')
		.and('have.attr', 'data-to-role', 'Partner')

	releaseActiveDrag()

	cy.contains('#wayfinder ion-label', 'Partner task').should('be.visible')
	cy.contains('#wayfinder ion-label', 'Father task').should('not.exist')

	dragOnElement('#wayfinder [data-class="title"]', {
		deltaX: -140,
		pointerType: 'touch',
	})

	cy.contains('#wayfinder ion-label', 'Engineer task').should('be.visible')
	cy.contains('#wayfinder ion-label', 'Partner task').should('not.exist')
})

it('accepts a new swipe immediately during cancel animation', () => {
	dragOnElement('#wayfinder [data-class="title"]', {
		deltaX: -25,
		steps: 4,
		pointerType: 'touch',
	})

	cy.get('[data-testid="star-role-switcher-overlay"]')
		.should('exist')
		.and('have.attr', 'data-phase', 'cancelling')

	dragOnElement('#wayfinder [data-class="title"]', {
		deltaX: -140,
		pointerType: 'touch',
	})

	cy.contains('#wayfinder ion-label', 'Father task').should('be.visible')
	cy.contains('#wayfinder ion-label', 'Partner task').should('not.exist')
})

it('cancels short horizontal swipe below threshold without changing active filter', () => {
	dragOnElement('#wayfinder [data-class="title"]', {
		deltaX: -25,
		steps: 5,
		pointerType: 'touch',
		release: false,
	})

	cy.get('[data-testid="star-role-switcher-overlay"]')
		.should('exist')
		.and('have.css', 'opacity', '1')
		.and('have.attr', 'data-phase', 'swiping')

	releaseActiveDrag()

	cy.get('[data-testid="star-role-switcher-overlay"]', {
		timeout: 5000,
	}).should('not.exist')
	cy.contains('#wayfinder ion-label', 'Father task').should('be.visible')
	cy.contains('#wayfinder ion-label', 'Partner task').should('be.visible')
	cy.contains('#wayfinder ion-label', 'Engineer task').should('be.visible')
})

it('does not trigger switcher overlay on vertical scroll gesture', () => {
	dragOnElement('#wayfinder [data-class="title"]', {
		deltaX: 8,
		deltaY: 90,
		pointerType: 'touch',
	})

	cy.get('[data-testid="star-role-switcher-overlay"]').should('not.exist')
	cy.contains('#wayfinder ion-label', 'Father task').should('be.visible')
	cy.contains('#wayfinder ion-label', 'Partner task').should('be.visible')
})

it('ignores swipe gestures started on reorder handles or checkboxes', () => {
	dragOnElement('#wayfinder ion-reorder', {
		deltaX: -140,
		pointerType: 'touch',
	})
	cy.get('[data-testid="star-role-switcher-overlay"]').should('not.exist')

	dragOnElement('#wayfinder ion-checkbox', {
		deltaX: -140,
		pointerType: 'touch',
	})
	cy.get('[data-testid="star-role-switcher-overlay"]').should('not.exist')
})

it('places mood control in ViewMenu below xl and drives overlay mood colours', () => {
	cy.viewport(412, 915)

	cy.get('#main-content [data-testid="mood-control"]').should('not.be.visible')

	cy.get('#view-menu-button').click()
	cy.get('#view-menu [data-testid="mood-control"]').should('be.visible')
	cy.get('#view-menu [data-testid="mood-control"] ion-segment-button[value="hype"]').click({
		force: true,
	})
	cy.get('#view-menu [data-testid="mood-control"]').should(
		'have.attr',
		'data-mood',
		'hype',
	)

	cy.wait(500)
	cy.get('#view-menu-button').click({ force: true })
	cy.get('#view-menu').should('not.be.visible')

	dragOnElement('#wayfinder [data-class="title"]', {
		deltaX: -120,
		pointerType: 'touch',
		release: false,
	})

	cy.get('[data-testid="star-role-switcher-overlay"]')
		.should('exist')
		.and('have.attr', 'data-mood', 'hype')

	releaseActiveDrag()
})

it('keeps floating mood control on desktop at xl and above while hiding ViewMenu mood footer', () => {
	cy.viewport(1280, 800)

	cy.get('#main-content [data-testid="mood-control"]').should('be.visible')
	cy.get('#main-content [data-testid="mood-control"] ion-segment-button[value="hype"]').click({
		force: true,
	})
	cy.get('#main-content [data-testid="mood-control"]').should(
		'have.attr',
		'data-mood',
		'hype',
	)

	cy.get('#view-menu-button').click()
	cy.get('#view-menu').should('be.visible')
	cy.get('#view-menu [data-testid="mood-control"]').should('not.be.visible')

	cy.wait(500)
	cy.get('#view-menu-button').click({ force: true })

	dragOnElement('#wayfinder [data-class="title"]', {
		deltaX: -120,
		pointerType: 'mouse',
		release: false,
	})

	cy.get('[data-testid="star-role-switcher-overlay"]')
		.should('exist')
		.and('have.attr', 'data-mood', 'hype')

	releaseActiveDrag()
})
