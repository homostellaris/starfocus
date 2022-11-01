import Layout from '../components/common/Layout'
import Features from '../components/landingPage/Features'
import Footer from '../components/landingPage/Footer'
import LandingScreen from '../components/landingPage/LandingScreen'

const featuresCount = 1
const otherScreensCount = 1
const moreFeaturesComingSoonCount = 1
const screensCount =
	featuresCount + otherScreensCount + moreFeaturesComingSoonCount

export default function IndexPage() {
	return (
		<Layout title="Starfocus | The todo app for the future">
			<div className="plane-0 adjust-for-scrollbar h-full">
				<LandingScreen />
			</div>
			<div className="absolute -mx-2">
				<div className="h-[700vh] w-screen"></div>
				<Footer />
			</div>
			<div className="plane-0 adjust-for-scrollbar">
				<Features count={featuresCount} />
			</div>
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
