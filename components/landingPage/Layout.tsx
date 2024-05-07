import React, { ReactNode, useLayoutEffect, useRef, useState } from 'react'
import Head from 'next/head'
import PlausibleProvider from 'next-plausible'
import Starship from './Journey/Starship'
import Tracjectory from './Journey/Trajectory'
import Footer from '../common/Footer'
import Contact from './Contact'
import Planets from '../common/Planets'

const Layout = ({
	children,
	footerInitialDisplay,
	screensCount = 1,
	title,
}: {
	children: ReactNode
	footerInitialDisplay?: boolean
	screensCount?: number
	title?: string
}) => {
	useLayoutEffect(() => {
		function setupStarshipScroller() {
			const scroller = document.querySelector('.parallax-container')!
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

	const [lastScrollDirection] = useState<ScrollDirection>(
		footerInitialDisplay ? ScrollDirection.down : ScrollDirection.up,
	)
	const lastScrollTop = useRef(0)

	return (
		<div>
			<Head>
				<title>{title}</title>
			</Head>
			<main className="h-full">
				<div
					className="h-full parallax-container"
					// TODO: Extract function
					onScroll={event => {
						const element = event.target as Element

						if (element.scrollTop > lastScrollTop.current) {
							document
								.getElementById('calls-to-action')!
								.classList.remove('translate-y-20')
							document
								.getElementById('calls-to-action')!
								.classList.add('translate-y-0')
						} else {
							document
								.getElementById('calls-to-action')!
								.classList.remove('translate-y-0')
							document
								.getElementById('calls-to-action')!
								.classList.add('translate-y-20')
						}

						lastScrollTop.current = element.scrollTop
					}}
				>
					<div
						className={`absolute left-[calc(2.5vw-2px)] h-[calc(${
							screensCount * 100
						}vh)] w-[2px]`}
					>
						<Tracjectory />
					</div>
					<div
						id="starship"
						className="absolute left-0 right-0 m-auto h-[10vmin] w-[10vmin]"
					>
						<Starship />
					</div>
					<div
						className={`plane-negative-1 h-[calc(${
							screensCount * 100
						}vh)] absolute
							-z-10`}
					>
						<Planets height="h-[800vh]" />
					</div>
					{children}
				</div>
				<Footer display={lastScrollDirection === ScrollDirection.down}>
					<Contact />
				</Footer>
			</main>
		</div>
	)
}

enum ScrollDirection {
	up,
	down,
}

export default Layout
