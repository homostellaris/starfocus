import { useEffect } from 'react'
import Layout from '../components/common/Layout'
import Features from '../components/landingPage/Features'
import Footer from '../components/landingPage/Footer'
import LandingScreen from '../components/landingPage/LandingScreen'

const featuresCount = 7
const otherScreensCount = 1
const screensCount = featuresCount + otherScreensCount

export default function IndexPage() {
	useEffect(arrowKeyNavigation, [])

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

		const scroller = document.querySelector('.parallax-container')

		if (event.code === 'ArrowUp')
			scrollIncrement = Math.min(
				Math.floor(scroller.scrollTop / window.innerHeight) + 1,
				screensCount
			)
		if (event.code === 'ArrowDown')
			scrollIncrement = Math.max(
				Math.ceil(scroller.scrollTop / window.innerHeight) - 1,
				0
			)

		scroller.scrollTo(0, scrollIncrement * window.innerHeight)
	}
}
