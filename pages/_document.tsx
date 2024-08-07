import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
	return (
		<Html>
			<Head>
				<meta charSet="utf-8" />
				<meta
					name="description"
					content="For humanity to realise its full potential, you must realise yours.
					Starfocus will help you discover your purpose and create a unique
					constellation for it. Then we'll keep you on course as you embark
					on your journey, one todo at a time."
				/>
				<link
					href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap"
					rel="stylesheet"
				/>
				<link
					rel="icon"
					href="/icon.png?3d1a20130279e5c6"
					type="image/png"
					sizes="400x400"
				/>
				<link
					rel="manifest"
					href="/manifest.webmanifest"
					crossOrigin="use-credentials"
				/>
			</Head>
			<body>
				<Main />
				<NextScript />
			</body>
		</Html>
	)
}
