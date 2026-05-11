import { mount } from 'cypress/react'
import { setupIonicReact } from '@ionic/react'

// CSS imports are omitted here: Next.js's style-loader runs at module-evaluation
// time and crashes when document.head is not yet available in the Cypress iframe.
// Component tests check behaviour (callbacks, data-attributes), not visual style.
setupIonicReact({})

Cypress.Commands.add('mount', mount)

Cypress.on('uncaught:exception', err => {
	if (err.message.includes('ResizeObserver loop')) {
		return false
	}
})

declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Cypress {
		interface Chainable {
			mount: typeof mount
		}
	}
}
