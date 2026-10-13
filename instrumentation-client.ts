import posthog from 'posthog-js'
import identifyOnLoad from './app/identify'

export const POSTHOG_CONSENT_KEY = 'starfocus_posthog_consent'

const hasConsent =
	typeof window !== 'undefined' &&
	localStorage.getItem(POSTHOG_CONSENT_KEY) === 'granted'

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
if (posthogKey) {
	posthog.init(posthogKey, {
		capture_exceptions: true,
		capture_performance: {
			web_vitals: false, // Doesn't work with cookieless mode
		},
		cookieless_mode: hasConsent ? 'on_reject' : 'always',
		api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
		defaults: '2025-11-30',
		debug: process.env.NODE_ENV === 'development',
		enable_recording_console_log: false,
	})

	if (hasConsent) {
		posthog.opt_in_capturing()
	}

	identifyOnLoad()
}
