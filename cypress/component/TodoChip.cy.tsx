import React from 'react'
import { IonApp } from '@ionic/react'
import { TodoChip } from '../../components/todos/TodoChip'
import { StarRole, Todo } from '../../components/db'

const starRole: StarRole = {
	id: 'role-1',
	title: 'Captain',
	icon: { type: 'ionicon', name: 'planetOutline' },
}

const sampleTodo: Todo = {
	id: 'todo-1',
	title: 'Launch Starship',
	starPoints: 3,
	createdAt: new Date(),
}

it('renders star points, title, and star role icon with balanced spacing', () => {
	cy.mount(
		<IonApp>
			<TodoChip
				todo={sampleTodo}
				starRole={starRole}
			/>
		</IonApp>,
	)

	cy.get('[data-testid="todo-chip"]').should('be.visible')
	cy.get('[data-testid="todo-chip-star-points"]').should('have.text', '3')
	cy.contains('ion-label', 'Launch Starship').should('be.visible')
	cy.get('[data-class="star-role-icon"]').should('exist')
	cy.get('[data-class="star-role-icon"]').should(
		'have.attr',
		'data-star-role',
		'Captain',
	)
})

it('fires onClick callback when clicked', () => {
	const onClickSpy = cy.spy().as('chipClick')

	cy.mount(
		<IonApp>
			<TodoChip
				todo={sampleTodo}
				starRole={starRole}
				onClick={onClickSpy}
			/>
		</IonApp>,
	)

	cy.get('[data-testid="todo-chip"]').click()
	cy.get('@chipClick').should('have.been.calledOnce')
})

it('renders default 0 points when star points are missing', () => {
	const todoWithoutPoints: Todo = {
		id: 'todo-2',
		title: 'Calibrate Sensors',
		createdAt: new Date(),
	}

	cy.mount(
		<IonApp>
			<TodoChip todo={todoWithoutPoints} />
		</IonApp>,
	)

	cy.get('[data-testid="todo-chip-star-points"]').should('have.text', '0')
})

it('renders without error when star role is undefined', () => {
	cy.mount(
		<IonApp>
			<TodoChip todo={sampleTodo} />
		</IonApp>,
	)

	cy.get('[data-testid="todo-chip"]').should('be.visible')
	cy.get('[data-class="star-role-icon"]').should('not.have.attr', 'data-star-role')
})
