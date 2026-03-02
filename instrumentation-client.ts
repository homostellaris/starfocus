import posthog from 'posthog-js'
import identifyOnLoad from './app/identify'

export const POSTHOG_CONSENT_KEY = 'starfocus_posthog_consent'

const originalConsoleMethods = {
	debug: console.debug.bind(console),
	log: console.log.bind(console),
	warn: console.warn.bind(console),
	error: console.error.bind(console),
	info: console.info.bind(console),
} as const

const hasConsent = localStorage.getItem(POSTHOG_CONSENT_KEY) === 'granted'

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY as string, {
	capture_exceptions: true,
	capture_performance: {
		web_vitals: false, // Doesn't work with cookieless mode
	},
	cookieless_mode: hasConsent ? 'on_reject' : 'always',
	api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
	defaults: '2025-11-30',
	debug: process.env.NODE_ENV === 'development',
})

if (hasConsent) {
	posthog.opt_in_capturing()
}

// PostHog's remote config can enable log capture which wraps console methods
// with JSON.stringify. This breaks Dexie Cloud sync because it logs objects
// with circular references. Re-wrap with try/catch after a delay to ensure
// we catch PostHog's async remote-config-driven wrapping.
const patchConsoleMethods = () => {
	for (const [level, originalFn] of Object.entries(originalConsoleMethods)) {
		const wrapped = console[level as keyof typeof originalConsoleMethods]
		if (wrapped !== originalFn) {
			console[level as keyof typeof originalConsoleMethods] = (
				...args: unknown[]
			) => {
				try {
					wrapped(...args)
				} catch {
					originalFn(...args)
				}
			}
		}
	}
}

// Patch immediately (in case logs are already loaded) and after remote config arrives
patchConsoleMethods()
setTimeout(patchConsoleMethods, 5000)

identifyOnLoad()

console.debug('instrumentation client loaded')
