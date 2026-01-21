import { defineConfig } from 'cypress'

export default defineConfig({
	video: true,
	screenshotOnRunFailure: true,
	e2e: {
		baseUrl: 'http://localhost:6603',
		includeShadowDom: true,
		setupNodeEvents(on, config) {
			// implement node event listeners here
		},
	},
})
