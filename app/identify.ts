import posthog from 'posthog-js'
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
				posthog.capture('user_logged_in')
				wasLoggedIn = true
			}
		} else {
			wasLoggedIn = false
		}
		console.debug('Not logged in')
	})
}
