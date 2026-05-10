/**
 * Component tests for SearchSuggestions keyboard navigation and click handling.
 * The E2E suite (home/search.cy.ts) covers integration with the Search modal
 * (breakpoint changes, query persistence). Tests here cover the component's own
 * behaviour in isolation: which callbacks fire, ArrowDown/ArrowUp/Enter handling,
 * and focus management within the list.
 */
import React from 'react'
import { IonApp } from '@ionic/react'
import { SearchSuggestions } from '../../components/search/SearchSuggestions'

const SUGGESTION_COUNT = 6
const FIRST_SUGGESTION_VALUE = 'is:snoozed'
const LAST_SUGGESTION_INDEX = SUGGESTION_COUNT - 1

function mount({
	onClick = cy.stub(),
	onFocusChange = cy.stub(),
	focusedIndex = -1,
}: {
	onClick?: Cypress.Agent<sinon.SinonStub>
	onFocusChange?: Cypress.Agent<sinon.SinonStub>
	focusedIndex?: number
} = {}) {
	cy.mount(
		<IonApp>
			<SearchSuggestions
				onClick={onClick}
				onFocusChange={onFocusChange}
				focusedIndex={focusedIndex}
			/>
		</IonApp>,
	)
}

const suggestions = () => cy.get('ion-list ion-item')

describe('SearchSuggestions', () => {
	describe('rendering', () => {
		it(`renders ${SUGGESTION_COUNT} suggestions`, () => {
			mount()
			suggestions().should('have.length', SUGGESTION_COUNT)
		})

		it('renders is:snoozed as the first suggestion', () => {
			mount()
			suggestions().first().should('contain.text', 'is:snoozed')
		})
	})

	describe('click', () => {
		it('calls onClick with the suggestion value when clicked', () => {
			const onClick = cy.stub().as('onClick')
			mount({ onClick })
			suggestions().first().click()
			cy.get('@onClick').should('have.been.calledOnceWith', FIRST_SUGGESTION_VALUE)
		})
	})

	describe('keyboard navigation', () => {
		it('calls onClick with the suggestion value when Enter is pressed', () => {
			const onClick = cy.stub().as('onClick')
			mount({ onClick, focusedIndex: 0 })
			suggestions()
				.first()
				.trigger('keydown', { key: 'Enter', bubbles: true })
			cy.get('@onClick').should('have.been.calledOnceWith', FIRST_SUGGESTION_VALUE)
		})

		it('calls onFocusChange with the next index when ArrowDown is pressed', () => {
			const onFocusChange = cy.stub().as('onFocusChange')
			mount({ onFocusChange, focusedIndex: 0 })
			suggestions()
				.first()
				.trigger('keydown', { key: 'ArrowDown', bubbles: true })
			cy.get('@onFocusChange').should('have.been.calledOnceWith', 1)
		})

		it('does not advance past the last suggestion on ArrowDown', () => {
			const onFocusChange = cy.stub().as('onFocusChange')
			mount({ onFocusChange, focusedIndex: LAST_SUGGESTION_INDEX })
			suggestions()
				.last()
				.trigger('keydown', { key: 'ArrowDown', bubbles: true })
			cy.get('@onFocusChange').should(
				'have.been.calledOnceWith',
				LAST_SUGGESTION_INDEX,
			)
		})

		it('calls onFocusChange(-1) when ArrowUp is pressed on the first suggestion', () => {
			const onFocusChange = cy.stub().as('onFocusChange')
			mount({ onFocusChange, focusedIndex: 0 })
			suggestions()
				.first()
				.trigger('keydown', { key: 'ArrowUp', bubbles: true })
			cy.get('@onFocusChange').should('have.been.calledOnceWith', -1)
		})

		it('navigates from second to first suggestion on ArrowUp', () => {
			const onFocusChange = cy.stub().as('onFocusChange')
			mount({ onFocusChange, focusedIndex: 1 })
			suggestions()
				.eq(1)
				.trigger('keydown', { key: 'ArrowUp', bubbles: true })
			cy.get('@onFocusChange').should('have.been.calledOnceWith', 0)
		})
	})

	describe('focus management', () => {
		it('focuses the element when focusedIndex prop points to it', () => {
			mount({ focusedIndex: 0 })
			suggestions().first().should('be.focused')
		})
	})
})
