import React, { ReactNode, useLayoutEffect } from 'react'
import Head from 'next/head'
import Planets from '../landingPage/Planets'
import PlausibleProvider from 'next-plausible'
import Starship from '../landingPage/Journey/Starship'
import Tracjectory from '../landingPage/Journey/Trajectory'

type Props = {
	children?: ReactNode
	title?: string
}

const Layout = ({ children, title = 'This is the default title' }: Props) => {
	useLayoutEffect(() => {
		function updateSize() {
			const scroller = document.querySelector('.parallax-container')
			const starship = document.querySelector('#starship') as HTMLElement

			const scrollerVisibleHeight = scroller.getBoundingClientRect().height
			const scrollerTotalHeight = scroller.scrollHeight

			const thumbHeight = 100
			const factor =
				(scrollerVisibleHeight - thumbHeight) /
				(scrollerTotalHeight - scrollerVisibleHeight)

			const adjustmentHorizontal =
				window.innerWidth / 2 - window.innerWidth / 10 / 4
			const adjustmentVertical = window.innerHeight / 2

			starship.style.transform = `
				scale(${1 / factor})
				translateZ(${1 - 1 / factor}px)
				translateX(${-adjustmentHorizontal}px)
				translateY(${adjustmentVertical}px)
			`
		}

		window.addEventListener('resize', updateSize)
		updateSize()
		return () => window.removeEventListener('resize', updateSize)
	}, [])

	return (
		<div>
			<Head>
				<title>{title}</title>
				<meta charSet="utf-8" />
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
				<main className="h-full">
					<div className="parallax-container h-full">
						<div className="absolute left-[calc(2.5vw-2px)] h-[800vh] w-[2px]">
							<Tracjectory />
						</div>
						<div
							id="starship"
							className="absolute left-0 right-0 m-auto h-[10vmin] w-[10vmin]"
						>
							<Starship />
						</div>
						<div className="plane-negative-1 absolute -z-10">
							<Planets height="h-[800vh]" />
						</div>
						{children}
					</div>
				</main>
			</PlausibleProvider>
		</div>
	)
}

export default Layout
