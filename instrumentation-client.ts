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

const computeSha1Digest = (data: Uint8Array): ArrayBuffer => {
	const dataLength = data.length
	const blockCount = ((dataLength + 8) >> 6) + 1
	const words = new Uint32Array(blockCount * 16)

	for (let index = 0; index < dataLength; index++) {
		words[index >> 2] |= data[index] << (24 - (index % 4) * 8)
	}
	words[dataLength >> 2] |= 0x80 << (24 - (dataLength % 4) * 8)
	words[blockCount * 16 - 1] = dataLength * 8

	let hash0 = 0x67452301
	let hash1 = 0xefcdab89
	let hash2 = 0x98badcfe
	let hash3 = 0x10325476
	let hash4 = 0xc3d2e1f0

	const workingSchedule = new Uint32Array(80)

	for (
		let blockIndex = 0;
		blockIndex < words.length;
		blockIndex += 16
	) {
		for (let index = 0; index < 16; index++) {
			workingSchedule[index] = words[blockIndex + index]
		}
		for (let index = 16; index < 80; index++) {
			const combinedWord =
				workingSchedule[index - 3] ^
				workingSchedule[index - 8] ^
				workingSchedule[index - 14] ^
				workingSchedule[index - 16]
			workingSchedule[index] =
				(combinedWord << 1) | (combinedWord >>> 31)
		}

		let currentA = hash0
		let currentB = hash1
		let currentC = hash2
		let currentD = hash3
		let currentE = hash4

		for (let index = 0; index < 80; index++) {
			let roundFunction = 0
			let roundConstant = 0
			if (index < 20) {
				roundFunction = (currentB & currentC) | (~currentB & currentD)
				roundConstant = 0x5a827999
			} else if (index < 40) {
				roundFunction = currentB ^ currentC ^ currentD
				roundConstant = 0x6ed9eba1
			} else if (index < 60) {
				roundFunction =
					(currentB & currentC) |
					(currentB & currentD) |
					(currentC & currentD)
				roundConstant = 0x8f1bbcdc
			} else {
				roundFunction = currentB ^ currentC ^ currentD
				roundConstant = 0xca62c1d6
			}

			const temporaryValue =
				(((currentA << 5) | (currentA >>> 27)) +
					roundFunction +
					currentE +
					roundConstant +
					workingSchedule[index]) >>>
				0
			currentE = currentD
			currentD = currentC
			currentC = ((currentB << 30) | (currentB >>> 2)) >>> 0
			currentB = currentA
			currentA = temporaryValue
		}

		hash0 = (hash0 + currentA) >>> 0
		hash1 = (hash1 + currentB) >>> 0
		hash2 = (hash2 + currentC) >>> 0
		hash3 = (hash3 + currentD) >>> 0
		hash4 = (hash4 + currentE) >>> 0
	}

	const resultBuffer = new ArrayBuffer(20)
	const dataView = new DataView(resultBuffer)
	dataView.setUint32(0, hash0)
	dataView.setUint32(4, hash1)
	dataView.setUint32(8, hash2)
	dataView.setUint32(12, hash3)
	dataView.setUint32(16, hash4)
	return resultBuffer
}

if (typeof window !== 'undefined') {
	const browserCrypto = window.crypto as Crypto | undefined
	if (browserCrypto && !browserCrypto.subtle) {
		const polyfilledSubtle = {
			digest: async (
				algorithm: string | { name: string },
				data: BufferSource,
			): Promise<ArrayBuffer> => {
				const algorithmName =
					typeof algorithm === 'string'
						? algorithm
						: algorithm?.name || ''
				if (/sha-?1/i.test(algorithmName)) {
					const dataBytes =
						data instanceof ArrayBuffer
							? new Uint8Array(data)
							: new Uint8Array(
									data.buffer,
									data.byteOffset,
									data.byteLength,
								)
					return computeSha1Digest(dataBytes)
				}
				throw new Error(
					`Unsupported digest algorithm in subtle polyfill: ${algorithmName}`,
				)
			},
		}

		try {
			Object.defineProperty(browserCrypto, 'subtle', {
				value: polyfilledSubtle,
				configurable: true,
				writable: true,
			})
		} catch {
			try {
				;(window as unknown as { crypto: unknown }).crypto = {
					...browserCrypto,
					subtle: polyfilledSubtle,
				}
			} catch {
				// Window crypto assignment blocked by browser
			}
		}
	}
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
			stack.includes('dexie') ||
			stack.includes('dexie-cloud') ||
			stack.includes('_sync') ||
			stack.includes('performInitialSync') ||
			stack.includes('LocalSyncWorker') ||
			stack.includes('Generator.next')
		) {
			return true
		}
	}

	if (typeof message === 'string') {
		if (
			message.includes('dexie.cloud') ||
			message.includes('dexie-cloud') ||
			message.includes('WebSocket observable')
		) {
			return true
		}
	}

	return false
}

if (typeof window !== 'undefined' && window.console) {
	const originalConsoleError = console.error.bind(console)
	const originalConsoleDebug = console.debug.bind(console)
	let currentConsoleError = originalConsoleError
	let isHandlingConsoleError = false

	try {
		Object.defineProperty(window.console, 'error', {
			configurable: true,
			enumerable: true,
			get() {
				return function interceptedConsoleError(
					this: unknown,
					...errorArguments: unknown[]
				) {
					if (isHandlingConsoleError) {
						return originalConsoleError.apply(this, errorArguments)
					}

					if (isDexieCloudNetworkError(errorArguments)) {
						originalConsoleDebug(
							'Dexie Cloud background sync network event:',
							...errorArguments
						)
						return
					}

					isHandlingConsoleError = true
					try {
						return currentConsoleError.apply(this, errorArguments)
					} finally {
						isHandlingConsoleError = false
					}
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

