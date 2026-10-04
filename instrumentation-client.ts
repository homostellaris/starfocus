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
	})

	if (hasConsent) {
		posthog.opt_in_capturing()
	}
}

/**
 * Detect expected network / sync errors from Dexie Cloud (such as offline mode,
 * server unreachable, or non-whitelisted development/tailscale hostnames)
 * so they don't trigger Next.js's dev error overlay.
 */
const isDexieCloudNetworkError = (args: unknown[]): boolean => {
	const err = args[0]
	if (!err) return false

	const errObj = err as { name?: string; message?: string; stack?: string }
	const message =
		typeof errObj.message === 'string' ? errObj.message : String(err)
	const isFetchError =
		(errObj.name === 'TypeError' || err instanceof TypeError) &&
		/failed to fetch/i.test(message)

	if (isFetchError) {
		const stack = errObj.stack || ''
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

// Intercept console.error using a getter/setter descriptor so that Next.js dev overlay
// or third-party wrappers cannot bypass our Dexie Cloud network error filter.
if (typeof window !== 'undefined' && window.console) {
	let currentConsoleError = originalConsoleMethods.error

	try {
		Object.defineProperty(window.console, 'error', {
			configurable: true,
			enumerable: true,
			get() {
				return function interceptedConsoleError(
					this: any,
					...args: unknown[]
				) {
					if (isDexieCloudNetworkError(args)) {
						originalConsoleMethods.debug(
							'Dexie Cloud background sync network event:',
							...args
						)
						return
					}
					return currentConsoleError.apply(this, args)
				}
			},
			set(fn: (...args: unknown[]) => void) {
				currentConsoleError = fn
			},
		})
	} catch (e) {
		originalConsoleMethods.warn(
			'Failed to define console.error property:',
			e
		)
	}

	window.addEventListener('unhandledrejection', event => {
		if (isDexieCloudNetworkError([event.reason])) {
			event.preventDefault()
			originalConsoleMethods.debug(
				'Dexie Cloud background sync network rejection handled:',
				event.reason
			)
		}
	})
}

const wrappedConsoleMethods = new WeakSet<object>()

// PostHog's remote config can enable log capture which wraps console methods
// with JSON.stringify. This breaks Dexie Cloud sync because it logs objects
// with circular references. Re-wrap with try/catch after a delay to ensure
// we catch PostHog's async remote-config-driven wrapping.
const patchConsoleMethods = () => {
	for (const [level, originalFn] of Object.entries(originalConsoleMethods)) {
		if (level === 'error') continue // Handled by getter/setter above
		const currentFn = console[level as keyof typeof originalConsoleMethods]
		if (wrappedConsoleMethods.has(currentFn)) continue

		const newFn = (...args: unknown[]) => {
			try {
				currentFn(...args)
			} catch {
				originalFn(...args)
			}
		}
		wrappedConsoleMethods.add(newFn)
		console[level as keyof typeof originalConsoleMethods] = newFn as any
	}
}

// Patch immediately (in case logs are already loaded) and after remote config arrives
patchConsoleMethods()
setTimeout(patchConsoleMethods, 5000)

identifyOnLoad()

console.debug('instrumentation client loaded')
