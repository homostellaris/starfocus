import AppDemo from './AppDemo'
import Layout from '../components/Layout'
import Button from './Button'
import StatementLarge from './StatementLarge'
import StatementSmall from './StatementSmall'
import Features from './Features'
import Journey from './Journey'
import { useEffect } from 'react'
import Planets from './Planets'

export default function IndexPage() {
	useEffect(() => {
		let lastKnownScrollPosition = 0
		let ticking = false

		document.addEventListener('scroll', e => {
			lastKnownScrollPosition = window.scrollY

			if (!ticking) {
				window.requestAnimationFrame(() => {
					doSomething(lastKnownScrollPosition)
					ticking = false
				})

				ticking = true
			}
		})

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
	}, [])

	useEffect(() => {
		const pagesCount = 8

		document.addEventListener(
			'keydown',
			event => {
				event.preventDefault()

				let scrollIncrement: number

				if (event.code === 'ArrowUp')
					scrollIncrement = Math.min(
						Math.floor(window.pageYOffset / window.innerHeight) + 1,
						pagesCount
					)
				if (event.code === 'ArrowDown')
					scrollIncrement = Math.max(
						Math.ceil(window.pageYOffset / window.innerHeight) - 1,
						0
					)

				window.scrollTo(0, scrollIncrement * window.innerHeight)
			},
			false
		)
	}, [])

	return (
		<Layout title="Starfocus | The todo app for the future">
			<main
				id="main"
				className="h-[800vh]"
			>
				<div
					id="parallax-container"
					className="fixed bottom-0 w-screen"
				>
					<div
						id="journey"
						className="sticky top-0 z-0"
					>
						<Journey />
					</div>
					{/* TODO: Get h-full working */}
					<Planets />
					<Features />
					<section
						id="hello"
						className="relative flex h-[calc(100vh-4rem)] flex-col"
					>
						<h1
							id="title"
							className="supernova text-center text-6xl font-extralight uppercase tracking-widest text-white"
						>
							{/* Find out why this has a weird margin. */}
							Starfocus
						</h1>
						<div className="flex flex-wrap items-center justify-center">
							<span className="w-80 border-b text-center">
								<StatementSmall>Avoid earthly distractions</StatementSmall>
							</span>
							<img
								src="/logo.png"
								className="mx-4 w-20"
							></img>
							<span className="w-80 border-b text-center">
								<StatementSmall>Stay focused</StatementSmall>
							</span>
						</div>
						<h2 className="text-center">
							<StatementLarge>Aim for the stars</StatementLarge>
						</h2>
						{/* <p className="hint font-light text-xl text-white text-center m-4">
						Scroll up or use the arrow keys to learn more
					</p> */}
						<div className="left-0 right-0 m-auto w-10/12 flex-grow p-4">
							{/* Make this sticky too */}
							<AppDemo />
						</div>
					</section>
					<footer
						id="calls-to-action"
						className="glass sticky bottom-0 m-auto flex h-[4rem] w-[90vw] items-center justify-center gap-4 rounded-t-2xl p-4"
					>
						<a
							href="https://discord.gg/TYHCj2VhpD"
							className="text-white"
							title="Join the Discord community to discuss ideas for the product and just generally nerd out on productivity and space exploration 🚀"
							target="_blank"
							rel="noopener noreferrer"
						>
							Discord
						</a>
						{/* <p className="text-slate-400 m-4">Beta coming soon</p> */}
						<Button
							className="supernova"
							title="Register your interest for the upcoming beta"
						>
							Register
						</Button>
						<a
							href="https://github.com/productivityguru/starfocus/discussions"
							className="w[10ch] text-white"
							title="Create a GitHub account and join our discussions where you can vote on feature ideas and provide more detailed feedback 💡"
							target="_blank"
							rel="noopener noreferrer"
						>
							GitHub
						</a>
					</footer>
				</div>
			</main>
		</Layout>
	)
}

function currentScrollPercentage() {
	return (
		((document.documentElement.scrollTop + document.body.scrollTop) /
			(document.documentElement.scrollHeight -
				document.documentElement.clientHeight)) *
		100
	)
}
