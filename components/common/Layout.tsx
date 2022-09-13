import React, { createContext, ReactNode, useEffect } from 'react'
import Head from 'next/head'
import Planets from '../landingPage/Planets'
import PlausibleProvider from 'next-plausible'

type Props = {
	children?: ReactNode
	title?: string
}

const Layout = ({ children, title = 'This is the default title' }: Props) => {
	return (
		<div>
			<Head>
				<title>{title}</title>
				<meta charSet="utf-8" />
				<meta
					name="viewport"
					content="initial-scale=1.0, width=device-width"
				/>
				<link
					href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap"
					rel="stylesheet"
				/>
				<script
					defer
					data-domain="starfocus.app"
					src="https://plausible.io/js/plausible.js"
				></script>
			</Head>
			<Planets height="h-[800vh]" />
			<PlausibleProvider
				domain="starfocus.app"
				trackOutboundLinks={true}
			>
				{children}
			</PlausibleProvider>
		</div>
	)
}

export default Layout