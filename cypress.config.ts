import { defineConfig } from 'cypress'

export default defineConfig({
	video: false,
	screenshotOnRunFailure: false,
	e2e: {
		baseUrl: process.env.CYPRESS_BASE_URL || `http://localhost:${process.env.PORT || '6600'}`,
		includeShadowDom: true,
		setupNodeEvents(_on, _config) {
			// implement node event listeners here
		},
	},
	component: {
		devServer: {
			framework: 'next',
			bundler: 'webpack',
		},
		includeShadowDom: true,
	},
})
