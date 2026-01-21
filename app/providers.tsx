'use client'

import { useEffect } from 'react'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
	useEffect(() => {
		posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY as string, {
			capture_performance: {
				web_vitals: false, // Doesn't work with cookieless mode
			},
			cookieless_mode: 'always',
			api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
			defaults: '2025-11-30',
			debug: process.env.NODE_ENV === 'development',
		})
	}, [])

	return <PHProvider client={posthog}>{children}</PHProvider>
}
