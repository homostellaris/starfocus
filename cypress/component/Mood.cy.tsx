import React from 'react'
import { IonApp } from '@ionic/react'
import Mood from '../../components/mood'
import { MoodProvider, useMood } from '../../components/mood/MoodContext'

function MoodConsumerBadge() {
	const { mode } = useMood()
	return <span data-testid="mood-consumer">{mode}</span>
}

it('switches shared mood state and renders only one audio element when two Mood controls share a provider', () => {
	cy.mount(
		<IonApp>
			<MoodProvider>
				<div data-testid="sidebar-slot">
					<Mood />
				</div>
				<div data-testid="floating-slot">
					<Mood />
				</div>
				<MoodConsumerBadge />
			</MoodProvider>
		</IonApp>,
	)

	cy.get('[data-testid="mood-consumer"]').should('have.text', 'chill')
	cy.get('audio').should('have.length', 1)

	cy.get('[data-testid="sidebar-slot"] ion-segment-button[value="hype"]').click()

	cy.get('[data-testid="mood-consumer"]').should('have.text', 'hype')
	cy.get('[data-testid="sidebar-slot"] [data-testid="mood-control"]').should(
		'have.attr',
		'data-mood',
		'hype',
	)
	cy.get('[data-testid="floating-slot"] [data-testid="mood-control"]').should(
		'have.attr',
		'data-mood',
		'hype',
	)
})
