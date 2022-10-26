import Layout from '../components/common/Layout'
import Features from '../components/landingPage/Features'
import Journey from '../components/landingPage/Journey'
import { useEffect, useLayoutEffect } from 'react'
import LandingScreen from '../components/landingPage/LandingScreen'
import Footer from '../components/landingPage/Footer'
import HeroMessage from '../components/landingPage/HeroMessage'
import Register from '../components/landingPage/Register'
import Contact from '../components/landingPage/Contact'
import A from '../components/common/A'
import Todos from '../components/todos'
import Planets from '../components/landingPage/Planets'
import Starship from '../components/landingPage/Journey/Starship'
import Tracjectory from '../components/landingPage/Journey/Trajectory'

const featuresCount = 1
const otherScreensCount = 1
const moreFeaturesComingSoonCount = 1
const screensCount =
	featuresCount + otherScreensCount + moreFeaturesComingSoonCount

const isComingSoonVersion = false

export default function IndexPage() {
	// eslint-disable-next-line react-hooks/exhaustive-deps
	// useEffect(isComingSoonVersion ? () => null : reverseScroll, [])
	// eslint-disable-next-line react-hooks/exhaustive-deps
	// useEffect(isComingSoonVersion ? () => null : arrowKeyNavigation, [])

	useLayoutEffect(() => {
		function updateSize() {
			const scroller = document.querySelector('.parallax-container')
			const starship = document.querySelector('#starship') as HTMLElement

			const scrollerVisibleHeight = scroller.getBoundingClientRect().height
			const scrollerTotalHeight = scroller.scrollHeight

			// const fractionOfContentVisible = scrollerVisibleHeight / scrollerTotalHeight
			// thumb.style.height = scrollerVisibleHeight * fractionOfContentVisible + 'px'

			const thumbHeight = 100
			const factor =
				(scrollerVisibleHeight - thumbHeight) /
				(scrollerTotalHeight - scrollerVisibleHeight)

			// const appDemoDOMRect = document
			// 	.getElementById('app-demo')
			// 	.getBoundingClientRect()
			// const leftColumnDOMRect = document
			// 	.querySelector('#app-demo .app-main .left-column')
			// 	.getBoundingClientRect()
			const adjustmentHorizontal =
				window.innerWidth / 2 - window.innerWidth / 10 / 4
			const adjustmentVertical = window.innerHeight / 2

			starship.style.transform = `
				scale(${1 / factor})
				translateZ(${1 - 1 / factor}px)
				translateX(${-adjustmentHorizontal}px)
				translateY(${adjustmentVertical}px)
			`

			const trajectory = document.querySelector('.trajectory') as HTMLElement
			trajectory.style.transform = `
				translateX(${-adjustmentHorizontal + 6}px)
			` // No idea why the 6px is necessary to align with the middle of the starship
		}

		window.addEventListener('resize', updateSize)
		updateSize()
		return () => window.removeEventListener('resize', updateSize)
	}, [])

	return (
		<Layout title="Starfocus | The todo app for the future">
			{isComingSoonVersion ? (
				<div className="h-screen pt-10">
					<HeroMessage />
					<p className="mt-20 text-center text-lg font-bold uppercase tracking-wider text-slate-200">
						Beta coming soon
					</p>
					<p className="text-center text-lg text-slate-400">Until then...</p>
					<div className="mx-auto mt-8 flex w-[90vw] flex-col items-center justify-center gap-4 space-y-5 rounded-2xl p-4">
						<div className="m-auto text-center">
							<Register />
						</div>
						<p className="max-w-prose text-center text-base text-white">
							Join the{' '}
							<A
								href="https://discord.gg/TYHCj2VhpD"
								target="_blank"
								rel="noopener noreferrer"
							>
								Discord
							</A>{' '}
							community to nerd out on productivity and space exploration
						</p>
						<p className="max-w-prose text-center text-base text-white">
							Join us on{' '}
							<A
								href="https://github.com/productivityguru/starfocus/discussions"
								target="_blank"
								rel="noopener noreferrer"
							>
								GitHub
							</A>{' '}
							where you can discuss feature ideas and report issues
						</p>
					</div>
					{/* TODO:
						- Decide what the description is for the product.
						- Make the Register component nice.
						- Hook the register button up to some sort of datastore (maybe try Hasura?)
					*/}
				</div>
			) : (
				<main
					id="landingPage"
					className="relative"
					// className={`h-[${screensCount * 100}vh]`}
				>
					<div className="parallax-container relative h-screen">
						{/* <div className="absolute mx-[calc(100vw/12*2)]">
							<Journey />
						</div> */}
						<div className="absolute left-0 right-0 m-auto h-[800vh] w-[2px]">
							<Tracjectory />
						</div>
						<div
							id="starship"
							className="absolute left-0 right-0 m-auto h-[5vw] w-[5vw]"
						>
							<Starship />
						</div>
						{/* <div
							id="landing-screen"
							className="h-[500px] w-[500px] bg-red-500"
						></div> */}
						<div className="plane-negative-1 absolute -z-10">
							<Planets height="h-[800vh]" />
						</div>
						<div className="plane-0 adjust-for-scrollbar">
							<LandingScreen />
						</div>
						<div className="absolute -mx-2">
							<div className="h-[700vh] w-screen"></div>
							<Footer />
						</div>
						<div className="plane-0 adjust-for-scrollbar">
							<Features count={featuresCount} />
						</div>
					</div>
				</main>
			)}
		</Layout>
	)
}

function arrowKeyNavigation() {
	document.addEventListener('keydown', arrowKeyListener, false)

	return () => {
		document.removeEventListener('keydown', arrowKeyListener)
	}

	function arrowKeyListener(event) {
		if (!['ArrowUp', 'ArrowDown'].includes(event.code)) return

		event.preventDefault()
		let scrollIncrement: number

		if (event.code === 'ArrowUp')
			scrollIncrement = Math.min(
				Math.floor(window.pageYOffset / window.innerHeight) + 1,
				screensCount
			)
		if (event.code === 'ArrowDown')
			scrollIncrement = Math.max(
				Math.ceil(window.pageYOffset / window.innerHeight) - 1,
				0
			)

		window.scrollTo(0, scrollIncrement * window.innerHeight)
	}
}

function reverseScroll() {
	let lastKnownScrollPosition = 0
	let ticking = false

	document.addEventListener('scroll', reverseScrollListener)

	return () => {
		document.removeEventListener('scroll', reverseScrollListener)
	}

	function reverseScrollListener(event) {
		lastKnownScrollPosition = window.scrollY

		if (!ticking) {
			window.requestAnimationFrame(() => {
				doSomething(lastKnownScrollPosition)
				ticking = false
			})

			ticking = true
		}
	}

	function doSomething(lastKnownScrollPosition) {
		const top = window.pageYOffset || document.documentElement.scrollTop

		const parallaxContainer = document.getElementById('parallax-container')
		const planets = document.getElementById('planets')
		const starship = document.getElementById('starship')

		parallaxContainer.style.bottom = String(top * -1) + 'px'
		planets.style.bottom = String(top * -0.1) + 'px'
		const starshipBottom =
			String((currentScrollPercentage() / 100) * 90 + 10) + 'vh'
		starship.style.bottom = starshipBottom
	}
}

function currentScrollPercentage() {
	return (
		((document.documentElement.scrollTop + document.body.scrollTop) /
			(document.documentElement.scrollHeight -
				document.documentElement.clientHeight)) *
		100
	)
}
