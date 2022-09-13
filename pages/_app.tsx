import '../styles/globals.css'
import { ConvexProvider, ConvexReactClient } from 'convex/react'
import clientConfig from '../convex/_generated/clientConfig'
import type { AppProps } from 'next/app'

const convex = new ConvexReactClient(clientConfig)

function MyApp({ Component, pageProps }: AppProps) {
	return (
		<ConvexProvider client={convex}>
			<Component {...pageProps} />
		</ConvexProvider>
	)
}

export default MyApp
