beforeEach(() => {
	cy.window().then(win => {
		if (win.db) win.db.close()
		return new Cypress.Promise(resolve => {
			const request = win.indexedDB.deleteDatabase('starfocus-z0vnq74nz')
			request.onsuccess = () => resolve(null)
			request.onerror = () => resolve(null)
			request.onblocked = () => resolve(null)
		})
	})
	cy.visit('/home')
	cy.get('ion-fab>ion-fab-button', { timeout: 10000 }).should('be.visible')
})

describe('closed', () => {
	it('opens to 100% and focuses the searchbar when / is pressed', () => {
		openSearch()
		shouldHaveBreakpoint(1)
		searchInput().should('be.focused')
	})

	it('opens to 100% and focuses the searchbar when the search FAB is clicked', () => {
		searchFab().click()
		shouldHaveBreakpoint(1)
		searchInput().should('be.focused')
	})
})

describe('peek (with active query)', () => {
	beforeEach(() => {
		openSearch()
		typeQuery('test')
	})

	it('clears query when escaping to peek', () => {
		pressKey('Escape')
		cy.wait(ANIMATION_MS)
		shouldHaveBreakpoint(PEEK_BREAKPOINT)
		searchModal().should('have.attr', 'data-query', '')
	})

	it('fully dismisses on second Escape from peek', () => {
		pressKey('Escape')
		cy.wait(ANIMATION_MS)
		shouldHaveBreakpoint(PEEK_BREAKPOINT)
		pressKey('Escape')
		cy.wait(ANIMATION_MS)
		shouldHaveBreakpoint(0)
	})

	it('fully reopens and restores query when the search FAB is clicked at peek', () => {
		pressKey('Escape')
		cy.wait(ANIMATION_MS)
		shouldHaveBreakpoint(PEEK_BREAKPOINT)
		searchFab().click()
		cy.wait(ANIMATION_MS)
		shouldHaveBreakpoint(1)
		searchInput().should('be.focused')
		searchModal().should('have.attr', 'data-query', 'test')
	})

	it('opens modal, focuses input and selects text when / is pressed again', () => {
		pressKey('Escape')
		cy.wait(ANIMATION_MS)
		shouldHaveBreakpoint(PEEK_BREAKPOINT)
		pressSlash()
		cy.wait(ANIMATION_MS)
		shouldHaveBreakpoint(1)
		searchInput().should('be.focused')
		searchInput().should(($input: JQuery<HTMLElement>) => {
			const input = $input[0] as HTMLInputElement
			expect(input.selectionStart).to.equal(0)
			expect(input.selectionEnd).to.equal('test'.length)
		})
	})

	it('opens to 100% when query is deleted', () => {
		typeQuery('')
		cy.wait(ANIMATION_MS)
		shouldHaveBreakpoint(1)
	})

	it('opens to 100% when query is cleared with clear button', () => {
		// includeShadowDom: true in cypress.config.ts — no .shadow() needed
		cy.get('#search-modal ion-searchbar [aria-label="reset"]').click({
			force: true,
		})
		searchModal().should('have.attr', 'data-query', '')
		cy.wait(ANIMATION_MS)
		shouldHaveBreakpoint(1)
	})
})

describe('open', () => {
	beforeEach(() => openSearch())

	it('fully dismisses on Escape with no query', () => {
		pressKey('Escape')
		cy.wait(ANIMATION_MS)
		shouldHaveBreakpoint(0)
	})

	it('snaps to peek on Escape with an active query', () => {
		typeQuery('test')
		pressKey('Escape')
		cy.wait(ANIMATION_MS)
		shouldHaveBreakpoint(PEEK_BREAKPOINT)
	})

	it('snaps to peek on Enter with an active query', () => {
		typeQuery('test')
		pressKey('Enter')
		cy.wait(ANIMATION_MS)
		shouldHaveBreakpoint(PEEK_BREAKPOINT)
	})

	it('does nothing on Enter with no query', () => {
		pressKey('Enter')
		shouldHaveBreakpoint(1)
	})

	it('moves focus to first suggestion on ArrowDown', () => {
		pressKey('ArrowDown')
		cy.focused().should('have.prop', 'tagName', 'ION-ITEM')
	})

	it('returns focus to searchbar on ArrowUp from first suggestion', () => {
		pressKey('ArrowDown')
		suggestions().first().trigger('keydown', { key: 'ArrowUp', bubbles: true })
		searchInput().should('be.focused')
	})

	it('navigates down through multiple suggestions', () => {
		pressKey('ArrowDown')
		suggestions()
			.first()
			.trigger('keydown', { key: 'ArrowDown', bubbles: true })
		suggestions()
			.eq(1)
			.then($second => {
				cy.focused().should($focused => {
					expect($focused[0]).to.equal($second[0])
				})
			})
	})

	it('selects a suggestion on Enter and snaps to peek', () => {
		pressKey('ArrowDown')
		cy.wait(ANIMATION_MS)
		shouldBeAtSuggestionsBreakpoint()
		suggestions().first().trigger('keydown', { key: 'Enter', bubbles: true })
		searchModal().should('have.attr', 'data-query', 'is:snoozed')
		cy.wait(ANIMATION_MS)
		shouldHaveBreakpoint(PEEK_BREAKPOINT)
	})

	it('stops at the last suggestion', () => {
		pressKey('ArrowDown')
		suggestions().each((_, index, list) => {
			if (index < list.length - 1) {
				cy.wrap(list[index]).trigger('keydown', {
					key: 'ArrowDown',
					bubbles: true,
					force: true,
				})
			}
		})
		// One more ArrowDown on the last item — should stay on last
		suggestions()
			.last()
			.trigger('keydown', { key: 'ArrowDown', bubbles: true, force: true })
		suggestions()
			.last()
			.then($last => {
				// Use .should() so Cypress retries until React settles after rapid triggers
				cy.focused().should($focused => {
					expect($focused[0]).to.equal($last[0])
				})
			})
	})

	it('opens to 100% when the suggestions are focused', () => {
		pressKey('ArrowDown')
		cy.wait(ANIMATION_MS)
		shouldBeAtSuggestionsBreakpoint()
	})
})

describe('mobile scroll', () => {
	it('main content area remains scrollable when search modal is at peek', () => {
		cy.viewport(390, 844) // iPhone 14 dimensions

		// Add enough todos to make the page scrollable
		cy.window().then(win =>
			(win as any).db.todos.bulkAdd(
				Array.from({ length: 30 }, (_, i) => ({
					id: `scroll-test-${i}`,
					title: `Scroll test todo ${i}`,
				})),
			),
		)
		cy.get('#database').should('exist')

		// Snap to peek — this is the state where the modal sits at the bottom as a
		// passive query indicator and background scrolling should still work
		openSearch()
		typeQuery('test')
		pressKey('Enter')
		cy.wait(ANIMATION_MS)
		shouldHaveBreakpoint(PEEK_BREAKPOINT)

		cy.get('ion-content')
			.then($el => ($el[0] as HTMLIonContentElement).getScrollElement())
			.as('scrollEl')

		cy.get('ion-content').realSwipe('toTop', { length: 300 })

		cy.get('@scrollEl').its('scrollTop').should('be.greaterThan', 0)
	})
})

const PEEK_BREAKPOINT = 52 / 362 // matches component: PEEK_HEIGHT / MODAL_HEIGHT
const ANIMATION_MS = 600 // ionic sheet animation takes 500ms to update currentBreakpoint

// Scope selectors to the search modal to avoid matching the login modal or view menu
const searchModal = () => cy.get('#search-modal')
const searchInput = () => cy.get('#search-modal ion-searchbar input')
const suggestions = () => cy.get('#search-modal ion-list ion-item')
const searchFab = () => cy.get('ion-fab ion-button').first()

const typeQuery = (value: string) => {
	// @ionic/react registers addEventListener('ionInput', handler) on the host element.
	// Dispatch ionInput via the page's own CustomEvent constructor so it reaches that handler.
	// Set host.value first so event.target.value returns the typed string in the handler.
	cy.window().then(win => {
		const host = win.document.querySelector(
			'#search-modal ion-searchbar',
		) as HTMLIonSearchbarElement
		if (!host) throw new Error('Search host not found')
		host.value = value
		host.dispatchEvent(
			new win.CustomEvent('ionInput', {
				bubbles: true,
				composed: true,
				detail: { value, event: undefined },
			}),
		)
	})
	// Wait for React to process the state update — the modal reflects query via data-query
	searchModal().should('have.attr', 'data-query', value)
}

// getCurrentBreakpoint returns a Promise — resolve it via .then() so Cypress awaits it before asserting.
// When the modal is fully dismissed (breakpoint 0) Ionic adds overlay-hidden and getCurrentBreakpoint
// returns undefined, so check the class instead.
const shouldHaveBreakpoint = (expected: number) => {
	if (expected === 0) {
		searchModal().should('have.class', 'overlay-hidden')
	} else {
		searchModal()
			.then($modal => ($modal[0] as HTMLIonModalElement).getCurrentBreakpoint())
			.should('equal', expected)
	}
}

const pressSlash = () =>
	cy.document().trigger('keydown', { key: '/', code: 'Slash', bubbles: true })

const openSearch = () => {
	pressSlash()
	// Wait for onDidPresent → setFocus() to complete, which happens after initSheetGesture().
	// Waiting for visibility alone fires during the enter animation, before moveSheetToBreakpoint is set.
	searchInput().should('be.focused')
}

const pressKey = (key: Parameters<(typeof cy)['realPress']>[0]) =>
	cy.realPress(key)

// The suggestions list is shown at full height — the modal has only three breakpoints:
// 0 (dismissed), PEEK_BREAKPOINT, and 1 (full open). ArrowDown snaps to 1.
const getSuggestionsBreakpoint = () => cy.wrap(1)

const shouldBeAtSuggestionsBreakpoint = () =>
	getSuggestionsBreakpoint().then(bp => shouldHaveBreakpoint(bp))
