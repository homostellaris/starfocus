import './commands'

Cypress.on('uncaught:exception', err => {
	if (
		err.message.includes('ResizeObserver loop') ||
		err.message.includes('Non-Error promise rejection') ||
		err.message.includes("Evaluating the object store's key path")
	) {
		return false
	}
})
