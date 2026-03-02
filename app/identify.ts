import posthog from 'posthog-js'
import { POSTHOG_CONSENT_KEY } from '../instrumentation-client'
import { db } from '../components/db'

export default function identifyOnLoad() {
	let wasLoggedIn = false
	return db.cloud.currentUser.subscribe(userLogin => {
		if (userLogin.isLoggedIn) {
			console.debug('Logged in', userLogin)
			posthog.identify(userLogin.userId, {
				email: userLogin.email,
			})
			if (!wasLoggedIn) {
				localStorage.setItem(POSTHOG_CONSENT_KEY, 'granted')
				posthog.set_config({ cookieless_mode: 'on_reject' })
				posthog.opt_in_capturing()
				posthog.capture('user_logged_in')
				wasLoggedIn = true
			}
		} else {
			if (wasLoggedIn) {
				localStorage.removeItem(POSTHOG_CONSENT_KEY)
				posthog.set_config({ cookieless_mode: 'always' })
			}
			wasLoggedIn = false
		}
		console.debug('Not logged in')
	})
}
