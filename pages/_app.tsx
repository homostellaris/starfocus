import '../styles/globals.css'
import { ConvexProvider, ConvexReactClient } from 'convex/react'
import clientConfig from '../convex/_generated/clientConfig'
import type { AppProps } from 'next/app'
import PlausibleProvider from 'next-plausible'

const convex = new ConvexReactClient(clientConfig)

function MyApp({ Component, pageProps }: AppProps) {
	return (
		<PlausibleProvider
			enabled={process.env.NEXT_PUBLIC_VERCEL_ENV === 'production'}
			domain="starfocus.app"
			trackOutboundLinks={true}
		>
			<ConvexProvider client={convex}>
				<Component {...pageProps} />
			</ConvexProvider>
		</PlausibleProvider>
	)
}

export default MyApp
