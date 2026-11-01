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

const isDexieCloudNetworkError = (errorArguments: unknown[]): boolean => {
	const error = errorArguments[0]
	if (!error) return false

	const errorObject = error as {
		name?: string
		message?: string
		stack?: string
	}
	const message =
		typeof errorObject.message === 'string'
			? errorObject.message
			: String(error)
	const isFetchError =
		(errorObject.name === 'TypeError' || error instanceof TypeError) &&
		/failed to fetch/i.test(message)

	if (isFetchError) {
		const stack = errorObject.stack || ''
		if (
			stack.includes('dexie-cloud') ||
			stack.includes('_sync') ||
			stack.includes('performInitialSync') ||
			stack.includes('LocalSyncWorker') ||
			stack.includes('Generator.next')
		) {
			return true
		}
	}

	if (typeof message === 'string' && message.includes('dexie.cloud')) {
		return true
	}

	return false
}

if (typeof window !== 'undefined' && window.console) {
	const originalConsoleError = console.error.bind(console)
	const originalConsoleDebug = console.debug.bind(console)
	let currentConsoleError = originalConsoleError

	try {
		Object.defineProperty(window.console, 'error', {
			configurable: true,
			enumerable: true,
			get() {
				return function interceptedConsoleError(
					this: unknown,
					...errorArguments: unknown[]
				) {
					if (isDexieCloudNetworkError(errorArguments)) {
						originalConsoleDebug(
							'Dexie Cloud background sync network event:',
							...errorArguments
						)
						return
					}
					return currentConsoleError.apply(this, errorArguments)
				}
			},
			set(newConsoleError: (...errorArguments: unknown[]) => void) {
				currentConsoleError = newConsoleError
			},
		})
	} catch (error) {
		originalConsoleDebug('Failed to define console.error property:', error)
	}

	window.addEventListener('unhandledrejection', event => {
		if (isDexieCloudNetworkError([event.reason])) {
			event.preventDefault()
			originalConsoleDebug(
				'Dexie Cloud background sync network rejection handled:',
				event.reason
			)
		}
	})
}

