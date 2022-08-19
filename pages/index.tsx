import Layout from '../components/common/Layout'
import Features from '../components/landingPage/Features'
import Journey from '../components/landingPage/Journey'
import { useEffect } from 'react'
import LandingScreen from '../components/landingPage/LandingScreen'
import Footer from '../components/landingPage/Footer'

const featuresCount = 7
const otherScreensCount = 1
const screensCount = featuresCount + otherScreensCount

export default function IndexPage() {
	useEffect(reverseScroll, [])
	useEffect(arrowKeyNavigation, [])

	return (
		<Layout title="Starfocus | The todo app for the future">
			<main
				id="landingPage"
				className={`h-[${screensCount * 100}vh]`}
			>
				<div
					id="parallax-container"
					className="fixed bottom-0 w-screen"
				>
					<div className="sticky top-0 z-0 mx-[calc(100vw/12*2)]">
						<Journey />
					</div>
					<Features count={featuresCount} />
					<LandingScreen />
					<Footer />
				</div>
			</main>
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
