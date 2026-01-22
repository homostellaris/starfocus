import type { VercelRequest, VercelResponse } from '@vercel/node'
import { PostHog } from 'posthog-node'

export default async function handler(
	request: VercelRequest,
	response: VercelResponse,
) {
	if (request.method !== 'POST') {
		return response.status(405).json({ error: 'Method not allowed' })
	}

	const { userId, email } = request.body

	console.debug('Posthog', {
		hasApiKey: !!process.env.POSTHOG_API_KEY,
		host: process.env.POSTHOG_HOST,
	})
	const posthog = new PostHog(process.env.POSTHOG_API_KEY!, {
		host: process.env.POSTHOG_HOST,
	})
	posthog.capture({
		distinctId: userId,
		event: 'user_signed_up',
		properties: {
			email,
			source: 'dexie-cloud',
		},
	})
	await posthog.shutdown()

	return response.status(200).json({
		ok: true,
		action: 'prod',
	})
}
