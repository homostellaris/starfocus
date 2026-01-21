import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Honk, Jura, Kode_Mono } from 'next/font/google'
import localFont from 'next/font/local'
import Script from 'next/script'

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css'

/* Basic CSS for apps built with Ionic */
// import '@ionic/react/css/structure.css'
import '@ionic/react/css/normalize.css'
import '@ionic/react/css/typography.css'

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/display.css'
import '@ionic/react/css/flex-utils.css'
import '@ionic/react/css/float-elements.css'
import '@ionic/react/css/padding.css'
import '@ionic/react/css/text-alignment.css'
import '@ionic/react/css/text-transformation.css'

/**
 * Ionic Dark Palette
 * -----------------------------------------------------
 * For more information, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */
import '@ionic/react/css/palettes/dark.always.css'

/* Theme variables */
import '../styles/globals.css'
import '../styles/theme.css'
import { PostHogProvider } from './providers'

export const metadata: Metadata = {
	title: 'Starfocus',
	description: 'Self-defined productivity',
	keywords: ['productivity', 'self-improvement', 'space'],
}

export const viewport: Viewport = {
	initialScale: 1,
	width: 'device-width',
	viewportFit: 'cover',
}

const funnelDisplay = localFont({
	src: './FunnelDisplay-VariableFont_wght.ttf',
	display: 'swap',
	variable: '--font-funnel-display',
})

const honk = Honk({
	subsets: ['latin'],
	display: 'swap',
	variable: '--font-honk',
	axes: ['MORF', 'SHLN'],
})

const jura = Jura({
	subsets: ['latin'],
	display: 'swap',
	variable: '--font-jura',
})

const kode = Kode_Mono({
	subsets: ['latin'],
	display: 'swap',
	variable: '--font-kode',
})

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html
			lang="en"
			className={`${funnelDisplay.variable} ${honk.variable} ${jura.variable} ${kode.variable}`}
		>
			<body>
				<PostHogProvider>{children}</PostHogProvider>
				<Analytics />
			</body>
			<Script
				type="module"
				src="https://unpkg.com/ionicons@5.2.3/dist/ionicons/ionicons.esm.js"
				strategy="lazyOnload"
			/>
			<Script
				noModule
				src="https://unpkg.com/ionicons@5.2.3/dist/ionicons/ionicons.js"
				strategy="lazyOnload"
			/>
		</html>
	)
}
