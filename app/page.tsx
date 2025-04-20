import Link from 'next/link'
import dynamic from 'next/dynamic'

const LazyMood = dynamic(() => import('../components/mood'), {
	ssr: false,
})

export default function Page() {
	return (
		<div className="bg-[radial-gradient(circle_700px_at_50%_250px,#4453a9,#000000)] min-h-screen">
			<header className="pt-4 mb-4 space-y-4 text-center text-white lg:mb-12">
				<h1 className="font-bold uppercase text-6xl lg:text-9xl font-display [font-palette:--redshift]">
					Starfocus
				</h1>
				<h2 className="font-mono text-xl font-bold lg:text-4xl">
					Self-defined productivity
				</h2>
			</header>
			<LazyMood />
			<main className="p-4 space-y-12 font-mono font-bold text-center text-white">
				<ol className="flex flex-wrap justify-center gap-4 max-w-[900px] mx-auto h-72">
					<li className="p-4 text-4xl bg-blue-600/15 grow text-white border-2 border-blue-500 text-left rounded shadow-lg font-display [font-palette:--blue]">
						Define
						<ul className="font-mono text-xl font-semibold">
							<li>Create star roles</li>
							<li>Assign star points</li>
						</ul>
					</li>
					<li className="p-4 text-4xl bg-blue-600/15 grow text-white border-2 border-blue-500 text-left rounded shadow-lg font-display [font-palette:--purple]">
						Focus
						<ul className="font-mono text-xl font-semibold">
							<li>Categorise</li>
							<li>Order</li>
							<li>Filter</li>
						</ul>
					</li>
					<li className="p-4 text-4xl bg-blue-600/15 grow text-white border-2 border-blue-500 text-left rounded shadow-lg font-display [font-palette:--red]">
						Execute
						<ul className="font-mono text-xl font-semibold">
							<li>Check-in</li>
							<li>Complete</li>
							<li>Earn star points</li>
						</ul>
					</li>
				</ol>
				<div className="space-y-4">
					<a
						className="inline-block px-4 py-2 text-3xl text-white uppercase border-2 rounded shadow-lg border-violet-500 shadow-violet-500/50 font-display [font-palette:--redshift] bg-violet-600/15 hover:bg-violet-700/20 active:bg-violet-800/30 transition-all duration-200 ease-in-out transform hover:scale-105"
						href="/home"
					>
						Try it
					</a>
					<p className="font-light">Free, private, no signup</p>
				</div>
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
				<footer>
					<nav>
						<ul className="fixed left-0 right-0 flex justify-center gap-4 mx-auto text-xl font-normal text-blue-300 underline w-fit bottom-4">
							<li>
								<Link href="/philosophy">Philosophy</Link>
							</li>
							<li>
								<a
									href="https://discord.gg/TYHCj2VhpD"
									title="Join the Discord community to discuss ideas for the product and just generally nerd out on productivity and space exploration 🚀"
									target="_blank"
									rel="noopener noreferrer"
								>
									Discord
								</a>
							</li>
							<li>
								<a
									href="https://github.com/astrochoric/starfocus"
									target="_blank"
									rel="noopener noreferrer"
								>
									GitHub
								</a>
							</li>
						</ul>
					</nav>
				</footer>
			</main>
		</div>
	)
}
