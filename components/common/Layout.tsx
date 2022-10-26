import React, { ReactNode } from 'react'
import Head from 'next/head'
import Planets from '../landingPage/Planets'
import PlausibleProvider from 'next-plausible'

type Props = {
	children?: ReactNode
	title?: string
}

const Layout = ({ children, title = 'This is the default title' }: Props) => {
	console.log(process.env.NEXT_PUBLIC_VERCEL_ENV)
	return (
		<div>
			<Head>
				<title>{title}</title>
				<meta charSet="utf-8" />
				<meta
					name="viewport"
					content="initial-scale=1.0, width=device-width"
				/>
				<script
					defer
					data-domain="starfocus.app"
					src="https://plausible.io/js/plausible.js"
				></script>
			</Head>
			<PlausibleProvider
				enabled={false}
				domain="starfocus.app"
				trackOutboundLinks={true}
			>
				{children}
			</PlausibleProvider>
		</div>
	)
}

export default Layout
