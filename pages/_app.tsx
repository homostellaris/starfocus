import { ConvexProvider, ConvexReactClient } from 'convex/react'
import PlausibleProvider from 'next-plausible'
import type { AppProps } from 'next/app'
import Head from 'next/head'
import '../styles/globals.css'

const convex = new ConvexReactClient('https://unlucky-rabbit-377.convex.cloud')

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
