import React, { useEffect, useRef } from 'react'
import { IonApp } from '@ionic/react'
import { MoodProvider } from '../../components/mood/MoodContext'
import { Journey } from '../../components/starship/Journey'
import { TodoContext, TodoPosition } from '../../components/todos/TodoContext'

function JourneyHarness({
	nextTodoPosition = null,
}: {
	nextTodoPosition?: TodoPosition
}) {
	const ancestorRef = useRef<HTMLDivElement>(null)
	const starshipImage = () => ancestorRef.current?.querySelector('#starship img')

	useEffect(() => {
		const imageElement = starshipImage() as HTMLImageElement | null
		if (imageElement && imageElement.offsetHeight === 0) {
			Object.defineProperty(imageElement, 'offsetHeight', {
				configurable: true,
				value: 56,
			})
		}
	}, [])

	return (
		<IonApp>
			<MoodProvider>
				<TodoContext.Provider
					value={{
						nextTodo: {
							position: [nextTodoPosition, () => null],
						},
						selectedTodo: [null, () => null],
					}}
				>
					<div
						ref={ancestorRef}
						data-testid="journey-ancestor"
						style={{ height: '600px', position: 'relative' }}
					>
						<Journey commonAncestor={ancestorRef} />
					</div>
				</TodoContext.Provider>
			</MoodProvider>
		</IonApp>
	)
}

it('renders the trajectory line with full-height positioning classes and starship', () => {
	cy.mount(<JourneyHarness nextTodoPosition={{ top: 100, height: 56 }} />)

	cy.get('#starship').should('exist')
	cy.get('[data-testid="journey-ancestor"] > div')
		.should('have.class', 'relative')
		.and('have.class', 'min-h-full')
		.and('have.class', 'min-w-[56px]')

	cy.get('[data-testid="journey-ancestor"] > div > div')
		.first()
		.should('have.class', 'top-0')
		.and('have.class', 'bottom-0')
		.and('have.class', 'min-h-full')
})

it('positions the starship at the next todo offset', () => {
	cy.mount(<JourneyHarness nextTodoPosition={{ top: 200, height: 56 }} />)

	cy.get('#starship')
		.should('have.attr', 'style')
		.and('include', 'translateY(232px)')
})

it('resets starship position to zero when there is no next todo', () => {
	cy.mount(<JourneyHarness nextTodoPosition={null} />)

	cy.get('#starship')
		.should('have.attr', 'style')
		.and('include', 'translateY(0px)')
})
