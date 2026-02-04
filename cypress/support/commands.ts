/// <reference types="cypress" />

import '@4tw/cypress-drag-drop'
import { db, DexieStarfocus } from '../../components/db'

Cypress.Commands.add(
	'db',
	<T>(operation: (db: DexieStarfocus) => Promise<T>) => {
		return cy.wrap(
			new Cypress.Promise<T>((resolve, reject) => {
				operation(db).then(resolve).catch(reject)
			}),
			{ log: false },
		)
	},
)

declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Cypress {
		interface Chainable {
			db<T>(operation: (db: DexieStarfocus) => Promise<T>): Chainable<T>
		}
	}
}
