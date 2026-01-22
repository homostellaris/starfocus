import posthog from 'posthog-js'
import { db } from '../components/db'

export default function identifyOnLoad() {
	return db.cloud.currentUser.subscribe(userLogin => {
		if (userLogin.isLoggedIn) {
			console.debug('Logged in', userLogin)
			posthog.identify(userLogin.userId, {
				email: userLogin.email,
			})
		}
		console.debug('Not logged in')
	})
}
