'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { MoodProvider } from '../components/mood/MoodContext'
import Nav from '../components/common/Nav'

const LazyMood = dynamic(() => import('../components/mood'), {
	ssr: false,
})

export default function Page() {
	return (
		<div className="bg-[radial-gradient(circle_700px_at_50%_250px,#4453a9,#000000)] min-h-screen flex flex-col">
			<header className="pt-4 mb-4 space-y-4 text-center text-white lg:mb-12">
				<h1 className="font-bold uppercase text-6xl lg:text-9xl font-display [font-palette:--redshift]">
					Starfocus
				</h1>
				<h2 className="font-mono text-xl font-bold lg:text-4xl">
					Always know what to work on next
				</h2>
				<div className="pt-4">
					<Link
						className="inline-block px-6 py-3 text-2xl lg:text-3xl text-white uppercase border-2 rounded shadow-lg border-violet-500 shadow-violet-500/50 font-display [font-palette:--redshift] bg-violet-600/15 hover:bg-violet-700/20 active:bg-violet-800/30 transition-all duration-200 ease-in-out transform hover:scale-105"
						href="/home"
					>
						Get Started Free
					</Link>
					<p className="mt-2 text-sm text-gray-300">No signup required</p>
				</div>
			</header>
			<main className="p-4 space-y-8 font-mono font-bold text-center text-white">
				<ol className="flex flex-wrap justify-center gap-4 max-w-[900px] mx-auto">
					<li className="p-4 text-4xl bg-blue-600/15 grow text-white border-2 border-blue-500 text-left rounded shadow-lg font-display [font-palette:--blue]">
						Define
						<p className="font-mono text-lg font-medium mt-2">
							Set goals that matter to you and assign star points based on importance
						</p>
					</li>
					<li className="p-4 text-4xl bg-blue-600/15 grow text-white border-2 border-blue-500 text-left rounded shadow-lg font-display [font-palette:--purple]">
						Focus
						<p className="font-mono text-lg font-medium mt-2">
							See your priorities clearly with smart filtering and ordering
						</p>
					</li>
					<li className="p-4 text-4xl bg-blue-600/15 grow text-white border-2 border-blue-500 text-left rounded shadow-lg font-display [font-palette:--red]">
						Execute
						<p className="font-mono text-lg font-medium mt-2">
							Complete tasks and earn star points to track your progress
						</p>
					</li>
				</ol>
				<blockquote className="mx-auto max-w-prose border-l-4 border-violet-500 pl-4 italic text-gray-300">
					<p className="font-sans font-medium text-lg">
						"Finally, a system that helps me focus on what I actually care about
						instead of drowning in endless task lists."
					</p>
				</blockquote>
				<p className="mx-auto font-sans font-medium max-w-prose text-lg">
					Not another todo list. A prioritisation engine that ensures you spend
					your time on what actually matters.
				</p>
				<div className="space-y-4">
					<Link
						className="inline-block px-6 py-3 text-2xl lg:text-3xl text-white uppercase border-2 rounded shadow-lg border-violet-500 shadow-violet-500/50 font-display [font-palette:--redshift] bg-violet-600/15 hover:bg-violet-700/20 active:bg-violet-800/30 transition-all duration-200 ease-in-out transform hover:scale-105"
						href="/home"
					>
						Start Earning Stars
					</Link>
					<p className="text-sm text-gray-300">Free forever. Your data stays on your device.</p>
				</div>
				<p className="mx-auto font-sans font-medium max-w-prose">
					You define your goals. You assign the points. Because this is your
					life and your journey.
				</p>
				{/* <iframe
					className="hidden mx-auto bottom-4 left-4 lg:block lg:absolute"
					style={{ borderRadius: '12px' }}
					src="https://open.spotify.com/embed/playlist/2ElbZQ2rRbRJTs2qUasUxP?utm_source=generator&theme=0"
					width="452"
					height="152"
					frameBorder={0}
					allowFullScreen
					allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
					loading="lazy"
				></iframe> */}
				<div className="block mx-auto lg:absolute bottom-4 left-4 w-fit min-w-screen">
					<MoodProvider>
						<LazyMood />
					</MoodProvider>
				</div>
			</main>
			<footer className="mt-auto mb-8">
				<Nav />
			</footer>
		</div>
	)
}
