import React, {
	ReactNode,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from 'react'
import Head from 'next/head'
import Planets from '../landingPage/Planets'
import PlausibleProvider from 'next-plausible'
import Starship from '../landingPage/Journey/Starship'
import Tracjectory from '../landingPage/Journey/Trajectory'
import Footer from '../landingPage/Footer'

const Layout = (props: { children?: ReactNode; title?: string }) => {
	useLayoutEffect(() => {
		function setupStarshipScroller() {
			const scroller = document.querySelector('.parallax-container')
			const starship = document.querySelector('#starship') as HTMLElement

			const scrollerVisibleHeight = (
				document.getElementsByClassName('parallax-container')[0] as HTMLElement
			).offsetHeight
			const scrollerTotalHeight = scroller.scrollHeight

			const thumbHeight = 100
			const factor =
				(scrollerVisibleHeight - thumbHeight) /
				(scrollerTotalHeight - scrollerVisibleHeight)

			const adjustmentHorizontal =
				window.innerWidth / 2 - window.innerWidth / 10 / 4
			const adjustmentVertical = scrollerVisibleHeight / 2

			starship.style.transform = `
				scale(${1 / factor})
				translateZ(${1 - 1 / factor}px)
				translateX(${-adjustmentHorizontal}px)
				translateY(${adjustmentVertical}px)
			`
		}

		setupStarshipScroller()
		window.addEventListener('resize', setupStarshipScroller)
		return () => window.removeEventListener('resize', setupStarshipScroller)
	}, [])

	const [lastScrollDirection, setLastScrollDSirection] =
		useState<ScrollDirection>()
	const lastScrollTop = useRef(0)

	return (
		<div>
			<Head>
				<title>{props.title}</title>
				<meta charSet="utf-8" />
				<meta
					name="viewport"
					content="initial-scale=1.0, width=device-width"
				/>
				<meta
					name="description"
					content="For humanity to realise its full potential, you must realise yours.
					Starfocus will help you discover your purpose and create a unique
					constellation for it. Then we'll keep you on course as you embark
					on your journey, one todo at a time."
				/>
			</Head>
			<PlausibleProvider
				enabled={process.env.NEXT_PUBLIC_VERCEL_ENV === 'production'}
				domain="starfocus.app"
				trackOutboundLinks={true}
			>
				<main className="h-full">
					<div
						className="h-full parallax-container"
						onScroll={event => {
							const element = event.target as Element

							if (element.scrollTop > lastScrollTop.current) {
								document
									.getElementById('calls-to-action')
									.classList.remove('translate-y-20')
								document
									.getElementById('calls-to-action')
									.classList.add('translate-y-0')
							} else {
								document
									.getElementById('calls-to-action')
									.classList.remove('translate-y-0')
								document
									.getElementById('calls-to-action')
									.classList.add('translate-y-20')
							}

							lastScrollTop.current = element.scrollTop
						}}
					>
						<div className="absolute left-[calc(2.5vw-2px)] h-[calc(800vh+5rem)] w-[2px]">
							<Tracjectory />
						</div>
						<div
							id="starship"
							className="absolute left-0 right-0 m-auto h-[10vmin] w-[10vmin]"
						>
							<Starship />
						</div>
						<div className="absolute plane-negative-1 -z-10">
							<Planets height="h-[800vh]" />
						</div>
						{props.children}
					</div>
					<Footer display={lastScrollDirection === ScrollDirection.down} />
				</main>
			</PlausibleProvider>
		</div>
	)
}

enum ScrollDirection {
	up,
	down,
}

export default Layout
