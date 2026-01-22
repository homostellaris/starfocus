import posthog from 'posthog-js'
import identifyOnLoad from './app/identify'

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY as string, {
	capture_performance: {
		web_vitals: false, // Doesn't work with cookieless mode
	},
	cookieless_mode: 'always',
	api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
	defaults: '2025-11-30',
	debug: process.env.NODE_ENV === 'development',
})
identifyOnLoad()

console.debug('instrumentation client loaded')
