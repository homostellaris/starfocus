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
	it('opens to 100% when the search FAB is clicked', () => {
		searchFab().click()
		shouldHaveBreakpoint(1)
		searchInput().should('not.be.focused')
	})

	it('opens to 100% and focuses the searchbar when / is pressed', () => {
		openSearch()
		shouldHaveBreakpoint(1)
		searchInput().should('be.focused')
	})
})

describe('open', () => {
	beforeEach(() => openSearch())

	it('fully dismisses on cancel button, clearing any active query', () => {
		typeQuery('test')
		cy.window().then(win => {
			const host = win.document.querySelector(
				'#search-modal ion-searchbar',
			) as HTMLIonSearchbarElement
			host?.dispatchEvent(
				new win.CustomEvent('ionCancel', { bubbles: true, composed: true }),
			)
		})
		cy.wait(ANIMATION_MS)
		shouldHaveBreakpoint(0)
		searchModal().should('have.attr', 'data-query', '')
	})

	it('fully dismisses on Escape with no query', () => {
		pressKey('Escape')
		cy.wait(ANIMATION_MS)
		shouldHaveBreakpoint(0)
	})

	it('snaps to peek on Escape with an active query, preserving the query', () => {
		typeQuery('test')
		pressKey('Escape')
		cy.wait(ANIMATION_MS)
		shouldHaveBreakpoint(PEEK_BREAKPOINT)
		searchModal().should('have.attr', 'data-query', 'test')
	})

	it('snaps to peek on Enter with an active query', () => {
		typeQuery('test')
		pressKey('Enter')
		cy.wait(ANIMATION_MS)
		shouldHaveBreakpoint(PEEK_BREAKPOINT)
		searchModal().should('have.attr', 'data-query', 'test')
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

	it('selects a suggestion on Enter, keeps the query and snaps to peek', () => {
		pressKey('ArrowDown')
		cy.wait(ANIMATION_MS)
		shouldBeAtSuggestionsBreakpoint()
		suggestions().first().trigger('keydown', { key: 'Enter', bubbles: true })
		cy.wait(ANIMATION_MS)
		shouldHaveBreakpoint(PEEK_BREAKPOINT)
		searchModal().should('have.attr', 'data-query', 'is:snoozed')
	})

	it('snaps to peek and keeps the query when a suggestion is clicked', () => {
		suggestions().first().click()
		cy.wait(ANIMATION_MS)
		shouldHaveBreakpoint(PEEK_BREAKPOINT)
		searchModal().should('have.attr', 'data-query', 'is:snoozed')
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

describe('peek', () => {
	beforeEach(() => {
		openSearch()
		typeQuery('test')
		pressKey('Enter')
		cy.wait(ANIMATION_MS)
		shouldHaveBreakpoint(PEEK_BREAKPOINT)
	})

	it('keeps the filter applied at peek', () => {
		searchModal().should('have.attr', 'data-query', 'test')
	})

	it('stays at peek and cannot be dismissed by pressing Escape', () => {
		pressKey('Escape')
		cy.wait(ANIMATION_MS)
		shouldHaveBreakpoint(PEEK_BREAKPOINT)
		searchModal().should('have.attr', 'data-query', 'test')
	})

	it('opens to 100%, focuses and selects text when / is pressed', () => {
		openSearch()
		shouldHaveBreakpoint(1)
		searchInput().should('be.focused')
		searchInput().should(($input: JQuery<HTMLElement>) => {
			const input = $input[0] as HTMLInputElement
			expect(input.selectionStart).to.equal(0)
			expect(input.selectionEnd).to.equal('test'.length)
		})
	})

	it('opens to 100% without focusing the searchbar when the search FAB is clicked', () => {
		searchFab().click()
		cy.wait(ANIMATION_MS)
		shouldHaveBreakpoint(1)
		searchInput().should('not.be.focused')
	})
})

const ANIMATION_MS = 600 // ionic sheet animation takes 500ms to update currentBreakpoint
const MODAL_HEIGHT = 362
const PEEK_HEIGHT = 52 // handle (10px) + searchbar (42px)
const PEEK_BREAKPOINT = parseFloat((PEEK_HEIGHT / MODAL_HEIGHT).toFixed(4))

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

// The component keeps data-breakpoint in sync via onIonBreakpointDidChange,
// so Cypress can poll it natively. When fully dismissed Ionic adds overlay-hidden
// and data-breakpoint is irrelevant, so check the class instead.
const shouldHaveBreakpoint = (expected: number) => {
	if (expected === 0) {
		searchModal().should('have.class', 'overlay-hidden')
	} else {
		searchModal().should('have.attr', 'data-breakpoint', String(expected))
	}
}

const pressSlash = () =>
	cy.document().trigger('keydown', { key: '/', code: 'Slash', bubbles: true })

const openSearch = () => {
	pressSlash()
	// data-presented is set at the end of focusAndRestore(), after setFocus() and value restoration,
	// ensuring the modal and its slot content are fully ready before tests continue.
	searchModal().should('have.attr', 'data-presented')
}

const pressKey = (key: Parameters<(typeof cy)['realPress']>[0]) =>
	cy.realPress(key)

// The suggestions list is shown at full height — the modal has only two non-zero breakpoints:
// PEEK_BREAKPOINT and 1. ArrowDown snaps to 1.
const getSuggestionsBreakpoint = () => cy.wrap(1)

const shouldBeAtSuggestionsBreakpoint = () =>
	getSuggestionsBreakpoint().then(bp => shouldHaveBreakpoint(bp))
