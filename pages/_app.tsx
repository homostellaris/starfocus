import { ConvexProvider, ConvexReactClient } from 'convex/react'
import PlausibleProvider from 'next-plausible'
import type { AppProps } from 'next/app'
import Head from 'next/head'
import clientConfig from '../convex/_generated/clientConfig'
import '../styles/globals.css'

const convex = new ConvexReactClient(clientConfig)

function MyApp({ Component, pageProps }: AppProps) {
	return (
		<>
			<Head>
				<meta
					name="viewport"
					content="initial-scale=1.0, width=device-width"
				/>
			</Head>
			<PlausibleProvider
				enabled={process.env.NEXT_PUBLIC_VERCEL_ENV === 'production'}
				domain="starfocus.app"
				trackOutboundLinks={true}
			>
				<ConvexProvider client={convex}>
					<Component {...pageProps} />
				</ConvexProvider>
			</PlausibleProvider>
		</>
	)
}

export default MyApp
